import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "system_admin" | "company_admin" | "department_admin" | "user" | "subcontractor";

type UserStatus = "pending_approval" | "active" | "suspended";

interface UserProfile {
  id: string;
  user_id: string;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  primary_department_id: string | null;
  status: UserStatus;
}

interface CompanyInfo {
  id: string;
  name: string;
  org_number: string | null;
  logo_url: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  accent_color: string | null;
  has_departments: boolean;
  employee_count: number | null;
}

interface GuestAccessInfo {
  project_id: string;
  project_name: string;
  project_number: string;
  access_level: 'guest' | 'full_ue';
  role_in_project: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  company: CompanyInfo | null;
  roles: AppRole[];
  isLoading: boolean;
  isSystemAdmin: boolean;
  isCompanyAdmin: boolean;
  isDepartmentAdmin: boolean;
  adminDepartmentIds: string[];
  isGuestUser: boolean;
  guestProjects: GuestAccessInfo[];
  guestCheckComplete: boolean;
  isPendingApproval: boolean;
  isSuspended: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [guestProjects, setGuestProjects] = useState<GuestAccessInfo[]>([]);
  const [guestCheckComplete, setGuestCheckComplete] = useState(false);
  const [adminDepartmentIds, setAdminDepartmentIds] = useState<string[]>([]);

  const isSystemAdmin = roles.includes("system_admin");
  const isCompanyAdmin = roles.includes("company_admin");
  const isDepartmentAdmin = adminDepartmentIds.length > 0;
  const isPendingApproval = profile?.status === "pending_approval";
  const isSuspended = profile?.status === "suspended";

  const fetchAdminDepartments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_departments")
        .select("department_id")
        .eq("user_id", userId)
        .eq("is_department_admin", true);

      if (error) throw error;
      setAdminDepartmentIds((data || []).map(d => d.department_id));
    } catch (error) {
      console.error("Error fetching admin departments:", error);
      setAdminDepartmentIds([]);
    }
  };

  const fetchGuestAccess = async (userId: string) => {
    try {
      const { data: accessData, error: accessError } = await supabase
        .from("ks_module2_project_access")
        .select("project_id, access_level, role_in_project, status")
        .eq("user_id", userId)
        .in("status", ["invited", "active"])
        .neq("access_level", "none");

      if (accessData && accessData.length > 0) {
        const projectIds = accessData.map(a => a.project_id);
        const { data: projects } = await supabase
          .from("ks_module2_projects")
          .select("id, project_name, project_number")
          .in("id", projectIds);

        const guestProjectsInfo: GuestAccessInfo[] = accessData.map(access => {
          const project = projects?.find(p => p.id === access.project_id);
          return {
            project_id: access.project_id,
            project_name: project?.project_name || "Ukjent prosjekt",
            project_number: project?.project_number || "",
            access_level: access.access_level as 'guest' | 'full_ue',
            role_in_project: access.role_in_project,
          };
        });

        setIsGuestUser(true);
        setGuestProjects(guestProjectsInfo);
        
        // Update access status to active and log login
        for (const access of accessData) {
          if (access.status === 'invited') {
            await supabase
              .from("ks_module2_project_access")
              .update({ status: 'active', last_login: new Date().toISOString() })
              .eq("project_id", access.project_id)
              .eq("user_id", userId);
          } else {
            await supabase
              .from("ks_module2_project_access")
              .update({ 
                last_login: new Date().toISOString(),
                login_count: supabase.rpc ? undefined : 1 // Will be incremented
              })
              .eq("project_id", access.project_id)
              .eq("user_id", userId);
          }
          
          // Log access
          await supabase.from("ks_module2_access_log").insert({
            access_id: access.project_id, // Use project_id as reference
            project_id: access.project_id,
            user_id: userId,
            email: user?.email || '',
            action: 'login',
          });
        }
      } else {
        setIsGuestUser(false);
        setGuestProjects([]);
      }
      setGuestCheckComplete(true);
    } catch (error) {
      console.error("Error fetching guest access:", error);
      setGuestCheckComplete(true);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);

        // Fetch company if user has one
        if (profileData.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("id, name, org_number, logo_url, address, postal_code, city, phone, email, accent_color, has_departments, employee_count")
            .eq("id", profileData.company_id)
            .maybeSingle();

          if (companyData) {
            setCompany(companyData as CompanyInfo);
          }
        }
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData.map((r) => r.role as AppRole));
        // Mark guest check as complete for users with roles
        setGuestCheckComplete(true);
      } else {
        // If no roles, check if this is a guest user
        await fetchGuestAccess(userId);
      }

      // Always fetch admin department IDs
      await fetchAdminDepartments(userId);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Debugging: track auth state changes that may cause unexpected redirects
        console.info("[Auth] onAuthStateChange", {
          event,
          hasSession: !!session,
          userId: session?.user?.id ?? null,
          expiresAt: session?.expires_at ?? null,
        });

        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          // If session disappears, clear app state.
          console.warn("[Auth] Session missing - clearing local auth state", { event });
          setProfile(null);
          setRoles([]);
          setIsGuestUser(false);
          setGuestProjects([]);
          setGuestCheckComplete(false);
          setAdminDepartmentIds([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.info("[Auth] getSession initial", {
        hasSession: !!session,
        userId: session?.user?.id ?? null,
        expiresAt: session?.expires_at ?? null,
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    // Send welcome email via edge function
    if (!error && data.user) {
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            userId: data.user.id,
            email: email,
            firstName: firstName,
          },
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail signup if email fails
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
    setRoles([]);
    setIsGuestUser(false);
    setGuestProjects([]);
  };

  const refreshCompany = async () => {
    if (!profile?.company_id) return;
    
    try {
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, org_number, logo_url, address, postal_code, city, phone, email, accent_color, has_departments, employee_count")
          .eq("id", profile.company_id)
          .maybeSingle();

      if (companyData) {
        setCompany(companyData as CompanyInfo);
      }
    } catch (error) {
      console.error("Error refreshing company:", error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        company,
        roles,
        isLoading,
        isSystemAdmin,
        isCompanyAdmin,
        isDepartmentAdmin,
        adminDepartmentIds,
        isGuestUser,
        guestProjects,
        guestCheckComplete,
        isPendingApproval,
        isSuspended,
        signIn,
        signUp,
        signOut,
        refreshCompany,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
