import { useState } from "react";
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
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");
  const [selectedCompany, setSelectedCompany] = useState<string>("");

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

  const getUserRoles = (userId: string): AppRole[] => {
    return userRoles?.filter((r) => r.user_id === userId).map((r) => r.role as AppRole) || [];
  };

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
                <div className="flex gap-2 pt-2 border-t border-border">
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
                    Administrer roller
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
      </div>
    </AdminLayout>
  );
}
