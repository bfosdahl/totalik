import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  Mail, 
  Loader2, 
  MoreVertical,
  Shield,
  User as UserIcon,
  Trash2,
  Edit2,
  Check,
  X,
  UserPlus,
  Eye,
  EyeOff,
  Building2,
  Clock,
  UserCheck,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/getInitials";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments } from "@/hooks/useDepartments";
import { useInvalidateCompanyUsers } from "@/hooks/useCompanyUsers";
import { t } from "@/i18n/t";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkEmployeeImportDialog } from "./BulkEmployeeImportDialog";
import { Upload, Send } from "lucide-react";

interface UserManagementSettingsProps {
  onBack: () => void;
}

type UserStatus = "pending_approval" | "active" | "suspended" | "deleted";

interface CompanyUser {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  status: UserStatus;
  role: "system_admin" | "company_admin" | "department_admin" | "user";
  isDepartmentAdmin?: boolean;
  adminDepartmentIds?: string[];
}

export function UserManagementSettings({ onBack }: UserManagementSettingsProps) {
  const { company, user } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createDirectDialogOpen, setCreateDirectDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendInviteNow, setSendInviteNow] = useState(false);
  const [sendDirectNow, setSendDirectNow] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [inviteFilter, setInviteFilter] = useState<"all" | "not_invited" | "invited" | "logged_in">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendingInvites, setSendingInvites] = useState(false);
  const [loginStatus, setLoginStatus] = useState<Record<string, { last_sign_in_at: string | null; invitation_sent_at: string | null; invitation_sent_by_name: string | null }>>({});
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "user" as "company_admin" | "department_admin" | "user",
    departmentId: "" as string,
    isDepartmentAdmin: false,
  });

  // Direct create form state
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user" as "company_admin" | "department_admin" | "user",
    departmentId: "" as string,
    isDepartmentAdmin: false,
  });

  // Fetch departments if company has departments enabled
  const { departments } = useDepartments(company?.id);
  const invalidateCompanyUsers = useInvalidateCompanyUsers();
  const hasDepartments = company?.has_departments && departments.length > 0;

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    role: "user" as "company_admin" | "department_admin" | "user",
    departmentId: "" as string,
    isDepartmentAdmin: false,
  });

  const loadUsers = async () => {
    if (!company?.id) return;

    setLoading(true);
    try {
      // Get all profiles for this company
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, company_id, first_name, last_name, email, phone, avatar_url, is_active, created_at, updated_at, is_verneombud, is_hms_responsible, primary_department_id, status, is_assigned_to_main, preferred_language, deleted_at")
        .eq("company_id", company.id);

      if (profilesError) throw profilesError;

      // Get roles for all users
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Get department admin info
      const { data: deptAdmins } = await supabase
        .from("user_departments")
        .select("user_id, department_id, is_department_admin")
        .in("user_id", profiles?.map(p => p.id) || [])
        .eq("is_department_admin", true);

      // Combine profile and role data
      const usersWithRoles: CompanyUser[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const userDeptAdmins = deptAdmins?.filter(d => d.user_id === profile.id) || [];
        const isDeptAdmin = userDeptAdmins.length > 0;
        
        // Determine role priority: system_admin > company_admin > department_admin > user
        let effectiveRole: "system_admin" | "company_admin" | "department_admin" | "user" = "user";
        if (userRole?.role === "system_admin") {
          effectiveRole = "system_admin";
        } else if (userRole?.role === "company_admin") {
          effectiveRole = "company_admin";
        } else if (isDeptAdmin) {
          effectiveRole = "department_admin";
        }
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          is_active: profile.is_active,
          status: (profile.status as UserStatus) || "active",
          role: effectiveRole,
          isDepartmentAdmin: isDeptAdmin,
          adminDepartmentIds: userDeptAdmins.map(d => d.department_id),
        };
      });

      // Sort so pending approval users are first
      usersWithRoles.sort((a, b) => {
        if (a.status === "pending_approval" && b.status !== "pending_approval") return -1;
        if (a.status !== "pending_approval" && b.status === "pending_approval") return 1;
        return 0;
      });

      setUsers(usersWithRoles);
      const { data: ls } = await supabase.rpc("get_company_user_login_status" as any, { _company_id: company.id });
      const map: typeof loginStatus = {};
      ((ls as any[]) || []).forEach((r) => { map[r.user_id] = r; });
      setLoginStatus(map);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(t("auto.kunne_ikke_laste_brukere"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
      invalidateCompanyUsers();
  }, [company?.id]);

  const handleInviteUser = async () => {
    if (!inviteForm.email.trim()) {
      toast.error(t("auto.e_post_er_paakrevd"));
      return;
    }

    if (inviteForm.role === "department_admin" && (!inviteForm.departmentId || inviteForm.departmentId === "none")) {
      toast.error(t("auto.du_maa_velge_en_avdeling_for_avdelingsle"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: inviteForm.email.trim(),
          firstName: inviteForm.firstName.trim(),
          lastName: inviteForm.lastName.trim(),
          role: inviteForm.role === "department_admin" ? "user" : inviteForm.role, // department_admin is not a user_roles role
          departmentId: inviteForm.departmentId,
          isDepartmentAdmin: inviteForm.role === "department_admin",
          sendEmail: sendInviteNow,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(sendInviteNow ? "Ansatt lagt til og brukerinfo sendt" : "Ansatt lagt til (ikke invitert ennå)");
      setSendInviteNow(false);
      setInviteDialogOpen(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "user", departmentId: "", isDepartmentAdmin: false });
      loadUsers();
      invalidateCompanyUsers();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast.error(error.message || "Kunne ikke invitere bruker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUserDirect = async () => {
    if (!createForm.email.trim()) {
      toast.error(t("auto.e_post_er_paakrevd"));
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      toast.error(t("auto.passord_maa_vaere_minst_6_tegn"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user-direct", {
        body: {
          email: createForm.email.trim(),
          password: createForm.password,
          sendEmail: sendDirectNow,
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          role: createForm.role,
        },
      });

      if (error) {
        console.error("create-user-direct error:", error, "context:", error.context);
        let errorMessage = "Kunne ikke opprette bruker";
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errorData = await error.context.json();
            errorMessage = errorData?.error || error.message || errorMessage;
          } else {
            errorMessage = error.message || errorMessage;
          }
        } catch {
          errorMessage = error.message || errorMessage;
        }
        
        // Check if it's a session/auth issue
        if (errorMessage.includes("Unauthorized") || errorMessage.includes("session")) {
          errorMessage = "Sesjonen din har utløpt. Vennligst last siden på nytt og prøv igjen.";
        }
        
        throw new Error(errorMessage);
      }
      if (data?.error) throw new Error(data.error);

      // Assign to department if selected (not "none")
      let departmentLinkError: string | null = null;
      if (createForm.departmentId && createForm.departmentId !== "none" && data?.userId) {
        const { data: createdProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.userId)
          .eq("company_id", company?.id ?? "")
          .maybeSingle();
        const { error: deptError } = await supabase.from("user_departments").insert({
          user_id: createdProfile?.id ?? data.userId,
          department_id: createForm.departmentId,
          is_department_admin: createForm.isDepartmentAdmin,
        });
        if (deptError) departmentLinkError = deptError.message;
      }

      if (departmentLinkError) {
        toast.error("Bruker opprettet, men kunne ikke knyttes til avdelingen: " + departmentLinkError);
      } else {
        toast.success(sendDirectNow ? t("auto.bruker_opprettet_2") : "Bruker opprettet (ingen e-post sendt)");
      }
      setSendDirectNow(false);
      setCreateDirectDialogOpen(false);
      setCreateForm({ email: "", password: "", firstName: "", lastName: "", role: "user", departmentId: "", isDepartmentAdmin: false });
      setShowPassword(false);
      loadUsers();
      invalidateCompanyUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Kunne ikke opprette bruker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: editForm.firstName.trim() || null,
          last_name: editForm.lastName.trim() || null,
        })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      // Update role if changed
      if (editForm.role !== selectedUser.role) {
        // Remove existing role (except system_admin)
        {
          const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.user_id)
          .neq("role", "system_admin");
          if (error) throw error;
        }

        // Remove existing department admin status
        {
          const { error } = await supabase
          .from("user_departments")
          .update({ is_department_admin: false })
          .eq("user_id", selectedUser.id);
          if (error) throw error;
        }

        // Add new role based on selection
        if (editForm.role === "company_admin") {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: selectedUser.user_id,
              role: "company_admin",
            });
          if (roleError) throw roleError;
        } else if (editForm.role === "department_admin" && editForm.departmentId && editForm.departmentId !== "none") {
          // Handle department admin - upsert to user_departments
          const { data: existing, error: existingError } = await supabase
            .from("user_departments")
            .select("id")
            .eq("user_id", selectedUser.id)
            .eq("department_id", editForm.departmentId)
            .maybeSingle();

          if (existingError) throw existingError;

          if (existing) {
            {
              const { error } = await supabase
              .from("user_departments")
              .update({ is_department_admin: true })
              .eq("id", existing.id);
              if (error) throw error;
            }
          } else {
            {
              const { error } = await supabase
              .from("user_departments")
              .insert({
                user_id: selectedUser.id,
                department_id: editForm.departmentId,
                is_department_admin: true,
              });
              if (error) throw error;
            }
          }
        }
      } else if (editForm.role === "department_admin") {
        // Role didn't change but department might have
        const currentDeptId = selectedUser.adminDepartmentIds?.[0];
        if (editForm.departmentId !== currentDeptId && editForm.departmentId && editForm.departmentId !== "none") {
          // Remove old department admin
          if (currentDeptId) {
            {
              const { error } = await supabase
              .from("user_departments")
              .update({ is_department_admin: false })
              .eq("user_id", selectedUser.id)
              .eq("department_id", currentDeptId);
              if (error) throw error;
            }
          }
          
          // Add new department admin
          const { data: existing, error: existingError } = await supabase
            .from("user_departments")
            .select("id")
            .eq("user_id", selectedUser.id)
            .eq("department_id", editForm.departmentId)
            .maybeSingle();

          if (existingError) throw existingError;

          if (existing) {
            {
              const { error } = await supabase
              .from("user_departments")
              .update({ is_department_admin: true })
              .eq("id", existing.id);
              if (error) throw error;
            }
          } else {
            {
              const { error } = await supabase
              .from("user_departments")
              .insert({
                user_id: selectedUser.id,
                department_id: editForm.departmentId,
                is_department_admin: true,
              });
              if (error) throw error;
            }
          }
        }
      }

      toast.success(t("auto.bruker_oppdatert"));
      setEditDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      invalidateCompanyUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Kunne ikke oppdatere bruker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    // Prevent deactivating yourself
    if (selectedUser.user_id === user?.id) {
      toast.error(t("auto.du_kan_ikke_deaktivere_din_egen_konto"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(t("auto.bruker_deaktivert"));
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      invalidateCompanyUsers();
    } catch (error: any) {
      console.error("Error deactivating user:", error);
      toast.error(error.message || "Kunne ikke deaktivere bruker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveUser = async (companyUser: CompanyUser) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", companyUser.id);

      if (error) throw error;

      toast.success(`${companyUser.first_name || companyUser.email} er nå godkjent!`);
      loadUsers();
      invalidateCompanyUsers();
    } catch (error: any) {
      console.error("Error approving user:", error);
      toast.error(error.message || "Kunne ikke godkjenne bruker");
    }
  };

  const inviteState = (u: CompanyUser): "logged_in" | "invited" | "not_invited" => {
    const s = loginStatus[u.user_id];
    if (s?.last_sign_in_at) return "logged_in";
    if (s?.invitation_sent_at) return "invited";
    return "not_invited";
  };

  const sendInvitations = async (ids: string[]) => {
    if (!ids.length) return;
    setSendingInvites(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-user-invitations", { body: { userIds: ids } });
      if (error) {
        let msg = "Kunne ikke sende invitasjon";
        try { const j = await (error as any).context?.json?.(); msg = j?.error || msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      toast.success(`Invitasjon sendt til ${data.sent} ansatt${data.sent === 1 ? "" : "e"}${data.failed?.length ? `, ${data.failed.length} feilet` : ""}`);
      setSelectedIds(new Set());
      loadUsers();
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke sende invitasjon");
    } finally {
      setSendingInvites(false);
    }
  };

  const handleSuspendUser = async (companyUser: CompanyUser) => {
    if (companyUser.user_id === user?.id) {
      toast.error(t("auto.du_kan_ikke_suspendere_din_egen_konto"));
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "suspended" })
        .eq("id", companyUser.id);

      if (error) throw error;

      toast.success(t("auto.bruker_suspendert"));
      loadUsers();
      invalidateCompanyUsers();
    } catch (error: any) {
      console.error("Error suspending user:", error);
      toast.error(error.message || "Kunne ikke suspendere bruker");
    }
  };

  const handleReactivateUser = async (companyUser: CompanyUser) => {
    try {
      const { data, error } = await supabase.functions.invoke("reactivate-user", {
        body: { userId: companyUser.user_id, role: "user" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(t("auto.bruker_reaktivert_husk_aa_tildele_avdeli"));
      loadUsers();
      invalidateCompanyUsers();
    } catch (error: any) {
      console.error("Error reactivating user:", error);
      toast.error(error.message || "Kunne ikke reaktivere bruker");
    }
  };

  const openEditDialog = (companyUser: CompanyUser) => {
    setSelectedUser(companyUser);
    setEditForm({
      firstName: companyUser.first_name || "",
      lastName: companyUser.last_name || "",
      role: companyUser.role === "system_admin" ? "company_admin" : companyUser.role,
      departmentId: companyUser.adminDepartmentIds?.[0] || "",
      isDepartmentAdmin: companyUser.isDepartmentAdmin || false,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (companyUser: CompanyUser) => {
    setSelectedUser(companyUser);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "pending_approval":
        return <Badge variant="outline" className="text-amber-600 border-amber-500 bg-amber-50 dark:bg-amber-950/30">{t("auto.venter_godkjenning")}</Badge>;
      case "suspended":
        return <Badge variant="outline" className="text-destructive border-destructive">{t("auto.suspendert")}</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string, isDepartmentAdmin?: boolean) => {
    switch (role) {
      case "system_admin":
        return <Badge variant="default" className="bg-primary">{t("auto.system_admin")}</Badge>;
      case "company_admin":
        return <Badge variant="secondary">{t("auto.administrator")}</Badge>;
      case "department_admin":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{t("auto.avdelingsleder")}</Badge>;
      default:
        if (isDepartmentAdmin) {
          return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{t("auto.avdelingsleder")}</Badge>;
        }
        return <Badge variant="outline">{t("auto.bruker")}</Badge>;
    }
  };


  if (!company) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("auto.brukere_og_tilgang")}</h1>
              <p className="text-muted-foreground">
                Administrer brukere i {company.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" onClick={() => setCreateDirectDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Med passord
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Legg til ansatt
          </Button>
        </div>
      </motion.div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-card"
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("auto.ingen_brukere_ennaa")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("auto.legg_til_eller_inviter_brukere_for_aa_gi")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreateDirectDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t("auto.legg_til")}
              </Button>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Legg til ansatt
              </Button>
            </div>
          </div>
        ) : (
          <>
          <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
            {([["all","Alle"],["not_invited","Ikke invitert"],["invited","Invitert"],["logged_in","Har logget inn"]] as const).map(([k, l]) => (
              <Button key={k} size="sm" variant={inviteFilter === k ? "default" : "outline"} onClick={() => { setInviteFilter(k); setSelectedIds(new Set()); }}>
                {l} ({k === "all" ? users.length : users.filter((u) => inviteState(u) === k).length})
              </Button>
            ))}
            {selectedIds.size > 0 && (
              <Button size="sm" className="ml-auto" disabled={sendingInvites} onClick={() => sendInvitations([...selectedIds])}>
                {sendingInvites ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send invitasjon til valgte ({selectedIds.size})
              </Button>
            )}
          </div>
          {inviteFilter === "not_invited" && users.some((u) => inviteState(u) === "not_invited" && u.is_active) && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border text-sm">
              <Checkbox
                id="select-all-invite"
                checked={users.filter((u) => inviteState(u) === "not_invited" && u.is_active).every((u) => selectedIds.has(u.user_id))}
                onCheckedChange={(v) => setSelectedIds(v === true ? new Set(users.filter((u) => inviteState(u) === "not_invited" && u.is_active).map((u) => u.user_id)) : new Set())}
              />
              <Label htmlFor="select-all-invite">Velg alle som ikke er invitert</Label>
            </div>
          )}
          <div className="divide-y divide-border">
            {users.filter((u) => inviteFilter === "all" || inviteState(u) === inviteFilter).map((companyUser) => (
              <div
                key={companyUser.id}
                className={`flex items-center justify-between gap-2 min-w-0 p-4 hover:bg-muted/50 transition-colors ${
                  companyUser.status === "pending_approval" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {companyUser.user_id !== user?.id && companyUser.role !== "system_admin" && companyUser.is_active && inviteState(companyUser) !== "logged_in" && (
                    <Checkbox
                      aria-label="Velg for invitasjon"
                      checked={selectedIds.has(companyUser.user_id)}
                      onCheckedChange={(v) => setSelectedIds((prev) => { const n = new Set(prev); v === true ? n.add(companyUser.user_id) : n.delete(companyUser.user_id); return n; })}
                    />
                  )}
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={companyUser.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(companyUser.first_name, companyUser.last_name, companyUser.email)}
                      </AvatarFallback>
                    </Avatar>
                    {companyUser.status === "pending_approval" && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {companyUser.first_name || companyUser.last_name
                          ? `${companyUser.first_name || ""} ${companyUser.last_name || ""}`.trim()
                          : companyUser.email || "Ukjent bruker"}
                      </span>
                      {getStatusBadge(companyUser.status)}
                      {!companyUser.is_active && companyUser.status !== "suspended" && (
                        <Badge variant="outline" className="text-destructive border-destructive">
                          {t("auto.deaktivert")}
                        </Badge>
                      )}
                      {companyUser.user_id === user?.id && (
                        <Badge variant="outline" className="text-primary border-primary">
                          {t("auto.deg")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{companyUser.email}</p>
                    {(() => {
                      const st = inviteState(companyUser);
                      const s = loginStatus[companyUser.user_id];
                      const d = (v?: string | null) => v ? new Date(v).toLocaleDateString("nb-NO") : "";
                      if (st === "logged_in") return <p className="text-xs text-primary">Har logget inn · sist {d(s?.last_sign_in_at)}</p>;
                      if (st === "invited") return <p className="text-xs text-muted-foreground">Invitert {d(s?.invitation_sent_at)}{s?.invitation_sent_by_name ? ` av ${s.invitation_sent_by_name}` : ""} · ikke logget inn</p>;
                      return <p className="text-xs text-destructive">Ikke invitert</p>;
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {companyUser.status === "pending_approval" && (
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveUser(companyUser)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      {t("auto.godkjenn")}
                    </Button>
                  )}
                  {getRoleBadge(companyUser.role)}
                  {companyUser.user_id !== user?.id && companyUser.role !== "system_admin" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {companyUser.is_active && (
                          <DropdownMenuItem onClick={() => sendInvitations([companyUser.user_id])}>
                            <Mail className="w-4 h-4 mr-2" />
                            {inviteState(companyUser) === "not_invited" ? "Send invitasjon" : "Send brukerinfo på nytt"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openEditDialog(companyUser)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          {t("auto.rediger")}
                        </DropdownMenuItem>
                        {companyUser.status === "pending_approval" && (
                          <DropdownMenuItem onClick={() => handleApproveUser(companyUser)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            {t("auto.godkjenn_bruker")}
                          </DropdownMenuItem>
                        )}
                        {(companyUser.status === "suspended" || companyUser.status === "deleted") ? (
                          <DropdownMenuItem onClick={() => handleReactivateUser(companyUser)}>
                            <Check className="w-4 h-4 mr-2" />
                            Reaktiver
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleSuspendUser(companyUser)}
                            className="text-destructive"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspender
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(companyUser)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deaktiver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </motion.div>

      <BulkEmployeeImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        existingEmails={users.map((u) => u.email || "").filter(Boolean)}
        onDone={() => { loadUsers(); invalidateCompanyUsers(); }}
      />

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til ansatt</DialogTitle>
            <DialogDescription>
              Ansatte får ingen e-post før du velger å sende brukerinfo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t("auto.e_post")}</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="bruker@eksempel.no"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-firstname">{t("auto.fornavn")}</Label>
                <Input
                  id="invite-firstname"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  placeholder={t("auto.ola")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-lastname">{t("auto.etternavn")}</Label>
                <Input
                  id="invite-lastname"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  placeholder={t("auto.nordmann")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">{t("auto.rolle")}</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value: "company_admin" | "department_admin" | "user") => 
                  setInviteForm({ ...inviteForm, role: value, isDepartmentAdmin: value === "department_admin" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Bruker
                    </div>
                  </SelectItem>
                  {hasDepartments && (
                    <SelectItem value="department_admin">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Avdelingsleder
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="company_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrator
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteForm.role === "department_admin" 
                  ? "Avdelingsleder kan administrere sin egen avdeling."
                  : "Administratorer kan administrere brukere og innstillinger."}
              </p>
            </div>
            {hasDepartments && inviteForm.role === "department_admin" && (
              <div className="space-y-2">
                <Label htmlFor="invite-department">{t("auto.avdeling")}</Label>
                <Select
                  value={inviteForm.departmentId}
                  onValueChange={(value) => 
                    setInviteForm({ ...inviteForm, departmentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_avdeling")} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.filter(d => d.is_active).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 rounded-lg border p-3">
            <Checkbox id="invite-send-now" checked={sendInviteNow} onCheckedChange={(v) => setSendInviteNow(v === true)} />
            <div>
              <Label htmlFor="invite-send-now">Send brukerinfo på e-post nå</Label>
              <p className="text-xs text-muted-foreground">Står av: ansatt lagres som «Ikke invitert».</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleInviteUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {sendInviteNow ? "Lagre og send" : "Lagre ansatt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Direct Dialog */}
      <Dialog open={createDirectDialogOpen} onOpenChange={setCreateDirectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auto.legg_til_ny_bruker")}</DialogTitle>
            <DialogDescription>
              {t("auto.opprett_en_bruker_direkte_med_e_post_og_")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">{t("auto.e_post")}</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="bruker@eksempel.no"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">{t("auto.passord_2")}</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder={t("auto.minst_6_tegn")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-firstname">{t("auto.fornavn")}</Label>
                <Input
                  id="create-firstname"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  placeholder={t("auto.ola")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastname">{t("auto.etternavn")}</Label>
                <Input
                  id="create-lastname"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  placeholder={t("auto.nordmann")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">{t("auto.rolle")}</Label>
              <Select
                value={createForm.role}
                onValueChange={(value: "company_admin" | "department_admin" | "user") => 
                  setCreateForm({ ...createForm, role: value, isDepartmentAdmin: value === "department_admin" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Bruker
                    </div>
                  </SelectItem>
                  {hasDepartments && (
                    <SelectItem value="department_admin">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Avdelingsleder
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="company_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrator
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {createForm.role === "department_admin" 
                  ? "Avdelingsleder kan administrere sin egen avdeling."
                  : "Administratorer kan administrere alle brukere og innstillinger."}
              </p>
            </div>
            {hasDepartments && (
              <div className="space-y-2">
                <Label htmlFor="create-department">{t("auto.avdeling_2")}</Label>
                <Select
                  value={createForm.departmentId}
                  onValueChange={(value) => 
                    setCreateForm({ ...createForm, departmentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg avdeling (valgfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {t("auto.ingen_avdeling")}
                      </div>
                    </SelectItem>
                    {departments.filter(d => d.is_active).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("auto.tildel_brukeren_til_en_avdeling_for_aa_f")}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 rounded-lg border p-3">
            <Checkbox id="direct-send-now" checked={sendDirectNow} onCheckedChange={(v) => setSendDirectNow(v === true)} />
            <Label htmlFor="direct-send-now">Send brukerinfo på e-post nå</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDirectDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleCreateUserDirect} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Legg til bruker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auto.rediger_bruker")}</DialogTitle>
            <DialogDescription>
              {t("auto.oppdater_brukerens_informasjon_og_tilgan")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstname">{t("auto.fornavn")}</Label>
                <Input
                  id="edit-firstname"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  placeholder={t("auto.fornavn")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastname">{t("auto.etternavn")}</Label>
                <Input
                  id="edit-lastname"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  placeholder={t("auto.etternavn")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">{t("auto.rolle")}</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "company_admin" | "department_admin" | "user") => 
                  setEditForm({ ...editForm, role: value, isDepartmentAdmin: value === "department_admin" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Bruker
                    </div>
                  </SelectItem>
                  {hasDepartments && (
                    <SelectItem value="department_admin">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Avdelingsleder
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="company_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrator
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasDepartments && editForm.role === "department_admin" && (
              <div className="space-y-2">
                <Label htmlFor="edit-department">{t("auto.avdeling")}</Label>
                <Select
                  value={editForm.departmentId}
                  onValueChange={(value) => 
                    setEditForm({ ...editForm, departmentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_avdeling")} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.filter(d => d.is_active).map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Lagre endringer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auto.deaktiver_bruker")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auto.er_du_sikker_paa_at_du_vil_deaktivere_de")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Deaktiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
