import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Building2,
  Mail,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Upload,
  Download,
  Boxes,
} from "lucide-react";
import { getModuleDefaultSettings } from "@/lib/moduleDefaults";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkUserImportDialog } from "@/components/admin/BulkUserImportDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { applyDefaultHmsSetup } from "@/lib/applyDefaultHmsSetup";
import { t } from "@/i18n/t";

type AppRole = "system_admin" | "company_admin" | "user";

const MODULE_OPTIONS = [
  { type: "IK_HMS", name: "IK HMS", description: t("auto.internkontroll_for_helse_miljoe_og_sikke") },
  { type: "IK_MAT", name: "IK MAT", description: t("auto.internkontroll_for_matsikkerhet") },
  { type: "IK_ALKOHOL", name: "IK Alkohol", description: t("auto.internkontroll_for_alkoholhaandtering") },
  { type: "IK_BYGG", name: "KS Bygg", description: t("auto.kvalitetssikring_for_byggprosjekter") },
  { type: "IK_FDV", name: "IK FDV", description: t("auto.forvaltning_drift_og_vedlikehold_av_bygg") },
  { type: "PERSONALHANDBOK", name: "Personalhåndbok", description: t("auto.digital_personalhaandbok") },
  { type: "GDPR", name: "GDPR", description: t("auto.personvern_og_datahaandtering") },
  { type: "APENHETSLOVEN", name: "Åpenhetsloven", description: t("auto.aktsomhetsvurderinger") },
];

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  // Debounced search term actually sent to the server
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [searchParams] = useSearchParams();
  const companyFilter = searchParams.get("company");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserCompanyId, setNewUserCompanyId] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "company_admin">("user");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [addModulesToCompany, setAddModulesToCompany] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Server-side pagination: fetch only the current page with only the
  // fields the table/cards actually render. `count: "exact"` gives the
  // total for the pagination bar without loading every row.
  const {
    data: profilesPage,
    isLoading,
    isFetching,
    error: profilesError,
  } = useQuery({
    queryKey: ["admin-profiles", companyFilter, currentPage, pageSize, debouncedSearch],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("profiles")
        .select("id, user_id, company_id, first_name, last_name, email, is_active, created_at, companies(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (companyFilter) {
        query = query.eq("company_id", companyFilter);
      }
      if (debouncedSearch) {
        const s = debouncedSearch.replace(/[%,()]/g, "");
        query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data || [], total: count ?? 0 };
    },
    retry: 1,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const profiles = profilesPage?.rows;
  const totalCount = profilesPage?.total ?? 0;

  // Page-scoped role lookup: only fetch roles for the users on screen
  // instead of the entire user_roles table.
  const pageUserIds = useMemo(
    () => (profiles || []).map((p) => p.user_id).filter(Boolean) as string[],
    [profiles]
  );
  const pageUserIdsKey = pageUserIds.join(",");

  const { data: companies } = useQuery({
    queryKey: ["admin-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("status", "active")
        .order("name")
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles", pageUserIdsKey],
    queryFn: async () => {
      if (pageUserIds.length === 0) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .in("user_id", pageUserIds);
      if (error) throw error;
      return data || [];
    },
    enabled: pageUserIds.length > 0,
    retry: 1,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const assignCompanyMutation = useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ company_id: companyId })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Bedrift oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First remove existing role of same type if exists
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      
      // Add new role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setIsRoleDialogOpen(false);
      toast({ title: "Rolle tildelt" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: t("auto.rolle_fjernet") });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !isActive })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "Bruker oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      // First create the user
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserEmail,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          companyId: newUserCompanyId,
          role: newUserRole,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // If modules are selected, add them to the company
      if (addModulesToCompany && selectedModules.length > 0 && newUserCompanyId) {
        for (const moduleType of selectedModules) {
          // Check if module already exists for this company
          const { data: existingModule } = await supabase
            .from("company_modules")
            .select("id")
            .eq("company_id", newUserCompanyId)
            .eq("module_type", moduleType)
            .single();

          if (!existingModule) {
            // Create new module
            await supabase.from("company_modules").insert({
              company_id: newUserCompanyId,
              module_type: moduleType,
              is_active: true,
              settings: getModuleDefaultSettings(moduleType),
            });

            // If KS Bygg module, create seed projects
            if (moduleType === "IK_BYGG") {
              const { createSeedProjects } = await import("@/utils/ksModule2SeedProjects");
              await createSeedProjects(newUserCompanyId);
            }
          } else {
            // Activate existing module if inactive
            await supabase
              .from("company_modules")
              .update({ is_active: true })
              .eq("id", existingModule.id);
          }
        }

        // Apply default HMS setup if IK_HMS is selected
        if (selectedModules.includes("IK_HMS")) {
          await applyDefaultHmsSetup(newUserCompanyId);
        }
      }

      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setIsCreateUserDialogOpen(false);
      
      // Automatisk synkroniser bedriften til kurssystemet
      if (newUserCompanyId) {
        try {
          await supabase.functions.invoke("sync-to-kurs", {
            body: { company_id: newUserCompanyId },
          });
          
        } catch (syncError) {
          console.error("Failed to sync to kurs:", syncError);
        }
      }
      
      resetNewUserForm();
      const moduleMsg = addModulesToCompany && selectedModules.length > 0 
        ? ` + ${selectedModules.length} modul(er) lagt til` 
        : "";
      toast({ 
        title: t("auto.bruker_opprettet_3"), 
        description: (data.emailSent ? "E-post med innloggingslenke er sendt" : "Bruker opprettet") + moduleMsg + " og synkronisert til kurssystem"
      });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async ({ userId, newEmail }: { userId: string; newEmail: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-change-user-email", {
        body: { userId, newEmail },
      });
      if (error) {
        const detail = (error as any).context?.error || error.message;
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      setIsEmailDialogOpen(false);
      setNewEmail("");
      setSelectedUser(null);
      toast({
        title: t("auto.e_post_endret"),
        description: `Brukeren logger nå inn med ${data.email}`,
      });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword, sendEmail }: { userId: string; newPassword: string; sendEmail: boolean }) => {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { userId, newPassword, sendEmail },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
      setSendPasswordEmail(true);
      toast({ 
        title: t("auto.passord_oppdatert_2"), 
        description: data.emailSent 
          ? "Brukerens passord er endret og sendt på e-post" 
          : "Brukerens passord er endret"
      });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });
      if (error) {
        let detail = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx?.json) {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          } else if (ctx?.text) {
            const txt = await ctx.text();
            if (txt) detail = txt;
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({ title: t("auto.bruker_slettet"), description: t("auto.brukeren_er_permanent_slettet_fra_system") });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
    },
  });

  const resetNewUserForm = () => {
    setNewUserEmail("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserCompanyId("");
    setNewUserRole("user");
    setSelectedModules([]);
    setAddModulesToCompany(false);
  };

  const toggleModuleSelection = (moduleType: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleType) 
        ? prev.filter(m => m !== moduleType)
        : [...prev, moduleType]
    );
  };

  const generatePassword = useCallback(() => {
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%&*';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    // Ensure at least one of each type
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining 8 characters randomly
    for (let i = 0; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewPassword(password);
    setShowPassword(true);
    setPasswordCopied(false);
  }, []);

  const copyPassword = useCallback(async () => {
    await navigator.clipboard.writeText(newPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  }, [newPassword]);

  // Build a Map for fast role lookups instead of filtering the array for every row
  const rolesMap = useMemo(() => {
    const map = new Map<string, AppRole[]>();
    userRoles?.forEach((r) => {
      const existing = map.get(r.user_id) || [];
      existing.push(r.role as AppRole);
      map.set(r.user_id, existing);
    });
    return map;
  }, [userRoles]);

  const getUserRoles = useCallback((userId: string): AppRole[] => {
    return rolesMap.get(userId) || [];
  }, [rolesMap]);

  // Filtering and slicing happen server-side; the current page IS the list.
  const paginatedProfiles = profiles || [];
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "system_admin":
        return <Badge variant="warning">{t("auto.system_admin")}</Badge>;
      case "company_admin":
        return <Badge variant="default">{t("auto.bedriftsadmin")}</Badge>;
      case "user":
        return <Badge variant="secondary">{t("auto.bruker")}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  // CSV export fetches ALL matching rows on demand (respecting the active
  // search/company filter) — independent of the paginated view.
  const exportUsersToCSV = useCallback(async () => {
    try {
      const buildQuery = (from: number, to: number) => {
        let q = supabase
          .from("profiles")
          .select("user_id, first_name, last_name, email, is_active, companies(name)")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (companyFilter) q = q.eq("company_id", companyFilter);
        if (debouncedSearch) {
          const s = debouncedSearch.replace(/[%,()]/g, "");
          q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
        }
        return q;
      };

      const PAGE = 1000;
      const all: any[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await buildQuery(from, from + PAGE - 1);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < PAGE) break;
      }

      if (all.length === 0) {
        toast({ title: t("auto.ingen_brukere"), description: t("auto.det_er_ingen_brukere_aa_eksportere"), variant: "destructive" });
        return;
      }

      // Fetch roles for exactly these users, chunked under the IN() limit
      const ids = all.map((p) => p.user_id).filter(Boolean) as string[];
      const rolesByUser = new Map<string, string[]>();
      for (let i = 0; i < ids.length; i += 500) {
        const { data: roleRows, error: rolesErr } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids.slice(i, i + 500));
        if (rolesErr) throw rolesErr;
        for (const r of roleRows || []) {
          rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) || []), r.role]);
        }
      }

      const headers = ["E-post", "Fornavn", "Etternavn", "Bedrift", "Roller", "Status"];
      const rows = all.map((profile) => {
        const roles = (rolesByUser.get(profile.user_id) || []).join(", ");
        const companyName = (profile as any).companies?.name || "Ingen bedrift";
        return [
          profile.email || "",
          profile.first_name || "",
          profile.last_name || "",
          companyName,
          roles || "Ingen roller",
          profile.is_active ? "Aktiv" : "Inaktiv",
        ];
      });

      const csvContent = [
        headers.join(";"),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")),
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `brukere-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: t("auto.eksport_fullfoert"), description: `${all.length} brukere eksportert til CSV` });
    } catch (err) {
      console.error("Error exporting users:", err);
      toast({ title: t("auto.eksport_feilet"), description: t("auto.kunne_ikke_eksportere_brukere"), variant: "destructive" });
    }
  }, [companyFilter, debouncedSearch, toast]);


  // Error handling for profiles query
  if (profilesError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
          <h2 className="text-xl font-bold mb-2">{t("auto.kunne_ikke_laste_brukere")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("auto.det_oppstod_en_feil_under_lasting_av_bru")}
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("auto.last_paa_nytt")}
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("auto.brukere")}</h1>
            <p className="text-muted-foreground">
              {t("auto.administrer_brukere_og_roller")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportUsersToCSV} className="flex-1 sm:flex-none min-w-[120px]">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t("auto.eksporter")}</span>
              <span className="sm:hidden">{t("auto.eksport")}</span>
            </Button>
            <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(true)} className="flex-1 sm:flex-none min-w-[120px]">
              <Upload className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t("auto.importer")}</span>
              <span className="sm:hidden">{t("auto.import")}</span>
            </Button>
            <Button onClick={() => setIsCreateUserDialogOpen(true)} className="flex-1 sm:flex-none min-w-[120px]">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t("auto.ny_bruker")}</span>
              <span className="sm:hidden">{t("auto.ny")}</span>
            </Button>
          </div>
        </motion.div>

        {/* Search and filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("auto.soek_etter_bruker")}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Users list - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:block bg-card rounded-xl border border-border shadow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">{t("auto.bruker")}</th>
                  <th className="text-left p-4 font-medium text-sm">{t("auto.bedrift")}</th>
                  <th className="text-left p-4 font-medium text-sm">{t("auto.roller")}</th>
                  <th className="text-left p-4 font-medium text-sm">{t("auto.status_2")}</th>
                  <th className="text-right p-4 font-medium text-sm">{t("auto.handlinger")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {t("auto.laster")}
                    </td>
                  </tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {t("auto.ingen_brukere_funnet")}
                    </td>
                  </tr>
                ) : (
                  paginatedProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {profile.first_name || profile.last_name
                                ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                                : "Ukjent bruker"}
                            </p>
                            <p className="text-xs text-muted-foreground">{profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {(profile as any).companies?.name || <span className="text-muted-foreground">{t("auto.ingen_bedrift")}</span>}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {getUserRoles(profile.user_id).map((role) => (
                            <span key={role}>{getRoleBadge(role)}</span>
                          ))}
                          {getUserRoles(profile.user_id).length === 0 && (
                            <span className="text-muted-foreground text-sm">{t("auto.ingen_roller")}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={profile.is_active ? "success" : "secondary"}>
                          {profile.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(profile);
                                setSelectedCompany(profile.company_id || "none");
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Administrer roller
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(profile);
                                setSelectedCompany(profile.company_id || "none");
                                setIsCompanyDialogOpen(true);
                              }}
                            >
                              <Building2 className="w-4 h-4 mr-2" />
                              {t("auto.endre_bedrift")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(profile);
                                setNewEmail(profile.email || "");
                                setIsEmailDialogOpen(true);
                              }}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              {t("auto.endre_e_post")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(profile);
                                setNewPassword("");
                                setIsPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              {t("auto.endre_passord")}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                toggleActiveMutation.mutate({
                                  userId: profile.user_id,
                                  isActive: profile.is_active,
                                })
                              }
                            >
                              <Users className="w-4 h-4 mr-2" />
                              {profile.is_active ? "Deaktiver" : "Aktiver"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedUser(profile);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("auto.slett_bruker")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Users list - Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:hidden space-y-3"
        >
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
              {t("auto.laster")}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
              {t("auto.ingen_brukere_funnet")}
            </div>
          ) : (
            paginatedProfiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-card rounded-xl border border-border p-4 space-y-3"
              >
                {/* User info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {profile.first_name || profile.last_name
                          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                          : "Ukjent bruker"}
                      </p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <Badge variant={profile.is_active ? "success" : "secondary"}>
                    {profile.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>

                {/* Company select */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("auto.bedrift")}</Label>
                  <p className="text-sm">
                    {(profile as any).companies?.name || <span className="text-muted-foreground">{t("auto.ingen_bedrift")}</span>}
                  </p>
                </div>

                {/* Roles */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("auto.roller")}</Label>
                  <div className="flex flex-wrap gap-1">
                    {getUserRoles(profile.user_id).map((role) => (
                      <span key={role}>{getRoleBadge(role)}</span>
                    ))}
                    {getUserRoles(profile.user_id).length === 0 && (
                      <span className="text-muted-foreground text-sm">{t("auto.ingen_roller")}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2 border-t border-border">
                  <div className="flex gap-2 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0"
                      onClick={() => {
                        setSelectedUser(profile);
                        setIsRoleDialogOpen(true);
                      }}
                    >
                      <Shield className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t("auto.roller")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-0"
                      onClick={() => {
                        setSelectedUser(profile);
                        setNewPassword("");
                        setIsPasswordDialogOpen(true);
                      }}
                    >
                      <Key className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t("auto.passord")}</span>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          userId: profile.user_id,
                          isActive: profile.is_active,
                        })
                      }
                    >
                      {profile.is_active ? "Deaktiver" : "Aktiver"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedUser(profile);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline ml-2">{t("auto.slett")}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {filteredProfiles.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("auto.vis")}</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>{t("auto.per_side")}</span>
              <span className="ml-2">
                ({((safePage - 1) * pageSize) + 1}–{Math.min(safePage * pageSize, filteredProfiles.length)} av {filteredProfiles.length})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(safePage - 1)}
              >
                Forrige
              </Button>
              <span className="px-3 text-sm text-muted-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
              >
                {t("auto.neste")}
              </Button>
            </div>
          </div>
        )}

        {/* Role management dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("auto.administrer_roller")}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Bruker: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                </p>

                <div className="space-y-2">
                  <Label>{t("auto.naavaerende_roller")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {getUserRoles(selectedUser.user_id).map((role) => (
                      <div key={role} className="flex items-center gap-1">
                        {getRoleBadge(role)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            removeRoleMutation.mutate({ userId: selectedUser.user_id, role })
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {getUserRoles(selectedUser.user_id).length === 0 && (
                      <span className="text-sm text-muted-foreground">{t("auto.ingen_roller_tildelt")}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("auto.tildel_ny_rolle")}</Label>
                  <div className="flex gap-2">
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{t("auto.bruker")}</SelectItem>
                        <SelectItem value="company_admin">{t("auto.bedriftsadmin")}</SelectItem>
                        <SelectItem value="system_admin">{t("auto.system_admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() =>
                        assignRoleMutation.mutate({
                          userId: selectedUser.user_id,
                          role: selectedRole,
                        })
                      }
                    >
                      Tildel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Company change dialog */}
        <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("auto.endre_bedrift")}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Bruker: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                </p>
                <div className="space-y-2">
                  <Label>{t("auto.bedrift")}</Label>
                  <Select
                    value={selectedCompany}
                    onValueChange={setSelectedCompany}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("auto.velg_bedrift")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("auto.ingen_bedrift")}</SelectItem>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    assignCompanyMutation.mutate({
                      userId: selectedUser.user_id,
                      companyId: selectedCompany === "none" ? null : selectedCompany,
                    });
                    setIsCompanyDialogOpen(false);
                  }}
                >
                  {t("auto.lagre")}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>


        <Dialog open={isCreateUserDialogOpen} onOpenChange={(open) => {
          setIsCreateUserDialogOpen(open);
          if (!open) resetNewUserForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("auto.opprett_ny_bruker")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">{t("auto.e_post")}</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  placeholder="bruker@eksempel.no"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newUserFirstName">{t("auto.fornavn")}</Label>
                  <Input
                    id="newUserFirstName"
                    placeholder={t("auto.ola")}
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserLastName">{t("auto.etternavn")}</Label>
                  <Input
                    id="newUserLastName"
                    placeholder={t("auto.nordmann")}
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("auto.bedrift_2")}</Label>
                <Select value={newUserCompanyId} onValueChange={setNewUserCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("auto.velg_bedrift")} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("auto.rolle")}</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "user" | "company_admin")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t("auto.bruker")}</SelectItem>
                    <SelectItem value="company_admin">{t("auto.bedriftsadmin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Module selection section */}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="addModules"
                    checked={addModulesToCompany}
                    onCheckedChange={(checked) => setAddModulesToCompany(checked === true)}
                  />
                  <Label htmlFor="addModules" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Boxes className="w-4 h-4" />
                    {t("auto.legg_til_moduler_for_bedriften")}
                  </Label>
                </div>
                
                {addModulesToCompany && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-lg">
                    {MODULE_OPTIONS.map((module) => (
                      <div
                        key={module.type}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedModules.includes(module.type)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-secondary/30"
                        }`}
                        onClick={() => toggleModuleSelection(module.type)}
                      >
                        <Checkbox
                          checked={selectedModules.includes(module.type)}
                          onCheckedChange={() => toggleModuleSelection(module.type)}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{module.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                  {t("auto.avbryt")}
                </Button>
                <Button
                  onClick={() => createUserMutation.mutate()}
                  disabled={!newUserEmail || !newUserCompanyId || createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Oppretter..." : "Opprett bruker"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change email dialog */}
        <Dialog open={isEmailDialogOpen} onOpenChange={(open) => {
          setIsEmailDialogOpen(open);
          if (!open) {
            setNewEmail("");
            setSelectedUser(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("auto.endre_e_post_brukernavn")}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Nåværende: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                </p>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">{t("auto.ny_e_postadresse")}</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ny@bedrift.no"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("auto.brukeren_logger_inn_med_den_nye_adressen")}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                    {t("auto.avbryt")}
                  </Button>
                  <Button
                    onClick={() => changeEmailMutation.mutate({
                      userId: selectedUser.user_id,
                      newEmail,
                    })}
                    disabled={
                      changeEmailMutation.isPending ||
                      !newEmail.includes("@") ||
                      newEmail.trim().toLowerCase() === (selectedUser.email || "").toLowerCase()
                    }
                  >
                    {changeEmailMutation.isPending ? "Lagrer..." : "Endre e-post"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Password reset dialog */}

        <Dialog open={isPasswordDialogOpen} onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) {
            setNewPassword("");
            setSelectedUser(null);
            setShowPassword(false);
            setPasswordCopied(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("auto.endre_passord")}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Endre passord for: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newPassword">{t("auto.nytt_passord_2")}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generatePassword}
                      className="h-7 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Generer passord
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auto.minst_6_tegn")}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordCopied(false);
                      }}
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      {newPassword && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={copyPassword}
                        >
                          {passwordCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("auto.passordet_maa_vaere_minst_6_tegn_langt")}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sendEmail" 
                    checked={sendPasswordEmail}
                    onCheckedChange={(checked) => setSendPasswordEmail(checked === true)}
                  />
                  <label
                    htmlFor="sendEmail"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("auto.send_passord_paa_e_post_til_brukeren")}
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    {t("auto.avbryt")}
                  </Button>
                  <Button
                    onClick={() => resetPasswordMutation.mutate({
                      userId: selectedUser.user_id,
                      newPassword: newPassword,
                      sendEmail: sendPasswordEmail,
                    })}
                    disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Oppdaterer..." : "Endre passord"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t("auto.slett_bruker")}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-xs sm:text-sm text-destructive font-medium">
                    {t("auto.advarsel_denne_handlingen_kan_ikke_angre")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    {t("auto.all_data_knyttet_til_brukeren_vil_bli_sl")}
                  </p>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Er du sikker på at du vil slette brukeren{" "}
                  <span className="font-medium">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </span>{" "}
                  ({selectedUser.email})?
                </p>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    {t("auto.avbryt")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteUserMutation.mutate(selectedUser.user_id)}
                    disabled={deleteUserMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {deleteUserMutation.isPending ? "Sletter..." : "Slett bruker"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk import dialog */}
        <BulkUserImportDialog
          open={isBulkImportDialogOpen}
          onOpenChange={setIsBulkImportDialogOpen}
          companies={companies || []}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
            queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
          }}
        />
      </div>
    </AdminLayout>
  );
}
