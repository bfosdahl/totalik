import { useState, useCallback } from "react";
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
} from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

type AppRole = "system_admin" | "company_admin" | "user";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const companyFilter = searchParams.get("company");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserCompanyId, setNewUserCompanyId] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "company_admin">("user");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles", companyFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });

      if (companyFilter) {
        query = query.eq("company_id", companyFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["admin-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
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
      toast({ title: "Rolle fjernet" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
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
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      setIsCreateUserDialogOpen(false);
      resetNewUserForm();
      toast({ 
        title: "Bruker opprettet", 
        description: data.emailSent ? "E-post med innloggingslenke er sendt" : "Bruker opprettet (e-post ikke sendt)"
      });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
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
        title: "Passord oppdatert", 
        description: data.emailSent 
          ? "Brukerens passord er endret og sendt på e-post" 
          : "Brukerens passord er endret"
      });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const resetNewUserForm = () => {
    setNewUserEmail("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserCompanyId("");
    setNewUserRole("user");
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

  const getUserRoles = useCallback((userId: string): AppRole[] => {
    return userRoles?.filter((r) => r.user_id === userId).map((r) => r.role as AppRole) || [];
  }, [userRoles]);

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "system_admin":
        return <Badge variant="warning">System Admin</Badge>;
      case "company_admin":
        return <Badge variant="default">Bedriftsadmin</Badge>;
      case "user":
        return <Badge variant="secondary">Bruker</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const filteredProfiles = profiles?.filter(
    (p) =>
      p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const exportUsersToCSV = useCallback(() => {
    if (!profiles || profiles.length === 0) {
      toast({ title: "Ingen brukere", description: "Det er ingen brukere å eksportere", variant: "destructive" });
      return;
    }

    const dataToExport = filteredProfiles || profiles;
    
    // Build CSV content
    const headers = ["E-post", "Fornavn", "Etternavn", "Bedrift", "Roller", "Status"];
    const rows = dataToExport.map(profile => {
      const roles = getUserRoles(profile.user_id).join(", ");
      const companyName = (profile as any).companies?.name || "Ingen bedrift";
      return [
        profile.email || "",
        profile.first_name || "",
        profile.last_name || "",
        companyName,
        roles || "Ingen roller",
        profile.is_active ? "Aktiv" : "Inaktiv"
      ];
    });

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(";"))
    ].join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brukere-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Eksport fullført", description: `${dataToExport.length} brukere eksportert til CSV` });
  }, [profiles, filteredProfiles, getUserRoles, toast]);

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
            <h1 className="text-2xl font-bold tracking-tight">Brukere</h1>
            <p className="text-muted-foreground">
              Administrer brukere og roller
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportUsersToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Eksporter
            </Button>
            <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
            <Button onClick={() => setIsCreateUserDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ny bruker
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
              placeholder="Søk etter bruker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                  <th className="text-left p-4 font-medium text-sm">Bruker</th>
                  <th className="text-left p-4 font-medium text-sm">Bedrift</th>
                  <th className="text-left p-4 font-medium text-sm">Roller</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-right p-4 font-medium text-sm">Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Laster...
                    </td>
                  </tr>
                ) : filteredProfiles?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Ingen brukere funnet
                    </td>
                  </tr>
                ) : (
                  filteredProfiles?.map((profile) => (
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
                        <Select
                          value={profile.company_id || "none"}
                          onValueChange={(value) =>
                            assignCompanyMutation.mutate({
                              userId: profile.user_id,
                              companyId: value === "none" ? null : value,
                            })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Velg bedrift" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ingen bedrift</SelectItem>
                            {companies?.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {getUserRoles(profile.user_id).map((role) => (
                            <span key={role}>{getRoleBadge(role)}</span>
                          ))}
                          {getUserRoles(profile.user_id).length === 0 && (
                            <span className="text-muted-foreground text-sm">Ingen roller</span>
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
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Administrer roller
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(profile);
                                setNewPassword("");
                                setIsPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Endre passord
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
              Laster...
            </div>
          ) : filteredProfiles?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
              Ingen brukere funnet
            </div>
          ) : (
            filteredProfiles?.map((profile) => (
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
                  <Label className="text-xs text-muted-foreground">Bedrift</Label>
                  <Select
                    value={profile.company_id || "none"}
                    onValueChange={(value) =>
                      assignCompanyMutation.mutate({
                        userId: profile.user_id,
                        companyId: value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Velg bedrift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ingen bedrift</SelectItem>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Roles */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Roller</Label>
                  <div className="flex flex-wrap gap-1">
                    {getUserRoles(profile.user_id).map((role) => (
                      <span key={role}>{getRoleBadge(role)}</span>
                    ))}
                    {getUserRoles(profile.user_id).length === 0 && (
                      <span className="text-muted-foreground text-sm">Ingen roller</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(profile);
                      setIsRoleDialogOpen(true);
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Roller
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(profile);
                      setNewPassword("");
                      setIsPasswordDialogOpen(true);
                    }}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Passord
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        userId: profile.user_id,
                        isActive: profile.is_active,
                      })
                    }
                  >
                    {profile.is_active ? "Deaktiver" : "Aktiver"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Role management dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Administrer roller</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Bruker: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                </p>

                <div className="space-y-2">
                  <Label>Nåværende roller:</Label>
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
                      <span className="text-sm text-muted-foreground">Ingen roller tildelt</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tildel ny rolle:</Label>
                  <div className="flex gap-2">
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Bruker</SelectItem>
                        <SelectItem value="company_admin">Bedriftsadmin</SelectItem>
                        <SelectItem value="system_admin">System Admin</SelectItem>
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

        {/* Create user dialog */}
        <Dialog open={isCreateUserDialogOpen} onOpenChange={(open) => {
          setIsCreateUserDialogOpen(open);
          if (!open) resetNewUserForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opprett ny bruker</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">E-post *</Label>
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
                  <Label htmlFor="newUserFirstName">Fornavn</Label>
                  <Input
                    id="newUserFirstName"
                    placeholder="Ola"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserLastName">Etternavn</Label>
                  <Input
                    id="newUserLastName"
                    placeholder="Nordmann"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bedrift *</Label>
                <Select value={newUserCompanyId} onValueChange={setNewUserCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg bedrift" />
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
                <Label>Rolle</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "user" | "company_admin")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Bruker</SelectItem>
                    <SelectItem value="company_admin">Bedriftsadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                  Avbryt
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
              <DialogTitle>Endre passord</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Endre passord for: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newPassword">Nytt passord *</Label>
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
                      placeholder="Minst 6 tegn"
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
                    Passordet må være minst 6 tegn langt.
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
                    Send passord på e-post til brukeren
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    Avbryt
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
