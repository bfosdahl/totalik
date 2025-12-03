import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "system_admin" | "company_admin" | "user";

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
  isGuestUser: boolean;
  guestProjects: GuestAccessInfo[];
  guestCheckComplete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCompany: () => Promise<void>;
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

  const isSystemAdmin = roles.includes("system_admin");
  const isCompanyAdmin = roles.includes("company_admin");

  const fetchGuestAccess = async (userId: string) => {
    try {
      console.log("Fetching guest access for user:", userId);
      const { data: accessData, error: accessError } = await supabase
        .from("ks_module2_project_access")
        .select("project_id, access_level, role_in_project, status")
        .eq("user_id", userId)
        .in("status", ["invited", "active"])
        .neq("access_level", "none");

      console.log("Guest access data:", accessData, "Error:", accessError);

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
            .select("id, name, org_number, logo_url, address, postal_code, city, phone, email, accent_color")
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
      } else {
        // If no roles, check if this is a guest user
        await fetchGuestAccess(userId);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setIsGuestUser(false);
          setGuestProjects([]);
          setGuestCheckComplete(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    
    const { error } = await supabase.auth.signUp({
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
        .select("id, name, org_number, logo_url, address, postal_code, city, phone, email, accent_color")
        .eq("id", profile.company_id)
        .maybeSingle();

      if (companyData) {
        setCompany(companyData as CompanyInfo);
      }
    } catch (error) {
      console.error("Error refreshing company:", error);
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
        isGuestUser,
        guestProjects,
        guestCheckComplete,
        signIn,
        signUp,
        signOut,
        refreshCompany,
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
