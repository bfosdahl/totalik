import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Power,
  UserPlus,
  Mail,
  Boxes,
  Award,
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { CompanyModulesDialog } from "@/components/admin/CompanyModulesDialog";

const companySchema = z.object({
  name: z.string().min(1, "Bedriftsnavn er påkrevd").max(100),
  org_number: z.string().optional(),
  email: z.string().email("Ugyldig e-post").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface AdminInviteData {
  email: string;
  firstName: string;
  lastName: string;
}

export default function AdminCompanies() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    org_number: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Admin invite state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteCompany, setInviteCompany] = useState<any>(null);
  const [inviteAdmin, setInviteAdmin] = useState(false);
  const [adminData, setAdminData] = useState<AdminInviteData>({
    email: "",
    firstName: "",
    lastName: "",
  });
  
  // Modules dialog state
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [modulesCompany, setModulesCompany] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, sg_approved, sg_expiry_date, sg_approval_areas")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const { data: newCompany, error } = await supabase.from("companies").insert({
        name: data.name,
        org_number: data.org_number || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
      }).select().single();
      if (error) throw error;
      return newCompany;
    },
    onSuccess: async (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setIsDialogOpen(false);
      
      // If inviting admin, call the edge function
      if (inviteAdmin && adminData.email) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await supabase.functions.invoke("create-company-admin", {
            body: {
              email: adminData.email,
              firstName: adminData.firstName,
              lastName: adminData.lastName,
              companyId: newCompany.id,
            },
          });
          
          if (response.error) {
            toast({ 
              title: "Bedrift opprettet", 
              description: `Bedrift opprettet, men kunne ikke invitere admin: ${response.error.message}`,
              variant: "destructive"
            });
          } else {
            toast({ 
              title: "Bedrift opprettet", 
              description: "Bedrift opprettet og administrator invitert." 
            });
          }
        } catch (err: any) {
          toast({ 
            title: "Bedrift opprettet", 
            description: `Bedrift opprettet, men kunne ikke invitere admin: ${err.message}`,
            variant: "destructive"
          });
        }
      } else {
        toast({ title: "Bedrift opprettet", description: "Ny bedrift er lagt til." });
      }
      
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const inviteAdminMutation = useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: AdminInviteData }) => {
      const response = await supabase.functions.invoke("create-company-admin", {
        body: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          companyId,
        },
      });
      
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      setInviteDialogOpen(false);
      setInviteCompany(null);
      setAdminData({ email: "", firstName: "", lastName: "" });
      toast({ title: "Administrator invitert", description: "E-post sendt til ny administrator." });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormData }) => {
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          org_number: data.org_number || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          postal_code: data.postal_code || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setIsDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      toast({ title: "Bedrift oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("companies")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast({ title: "Status oppdatert" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast({ title: "Bedrift slettet" });
    },
    onError: (error) => {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      org_number: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postal_code: "",
    });
    setErrors({});
    setInviteAdmin(false);
    setAdminData({ email: "", firstName: "", lastName: "" });
  };

  const handleInviteAdmin = (company: any) => {
    setInviteCompany(company);
    setAdminData({ email: "", firstName: "", lastName: "" });
    setInviteDialogOpen(true);
  };

  const submitInviteAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCompany || !adminData.email) return;
    inviteAdminMutation.mutate({ companyId: inviteCompany.id, data: adminData });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = companySchema.safeParse(formData);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (company: any) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      org_number: company.org_number || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      postal_code: company.postal_code || "",
    });
    setIsDialogOpen(true);
  };

  const filteredCompanies = companies?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.org_number?.includes(search)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Aktiv</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inaktiv</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspendert</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Bedrifter</h1>
            <p className="text-muted-foreground">
              Administrer bedrifter og lisenser
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCompany(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ny bedrift
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? "Rediger bedrift" : "Opprett ny bedrift"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Bedriftsnavn *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Bedrift AS"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org_number">Org.nummer</Label>
                    <Input
                      id="org_number"
                      value={formData.org_number}
                      onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                      placeholder="123 456 789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+47 123 45 678"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="kontakt@bedrift.no"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Gateadresse 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postnummer</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="0001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Sted</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Oslo"
                    />
                  </div>
                </div>
                
                {/* Admin invite section - only for new companies */}
                {!editingCompany && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="inviteAdmin"
                        checked={inviteAdmin}
                        onCheckedChange={(checked) => setInviteAdmin(checked === true)}
                      />
                      <Label htmlFor="inviteAdmin" className="text-sm font-medium cursor-pointer">
                        Inviter bedriftsadministrator
                      </Label>
                    </div>
                    
                    {inviteAdmin && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="adminEmail">Administrator e-post *</Label>
                          <Input
                            id="adminEmail"
                            type="email"
                            value={adminData.email}
                            onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                            placeholder="admin@bedrift.no"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="adminFirstName">Fornavn</Label>
                          <Input
                            id="adminFirstName"
                            value={adminData.firstName}
                            onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                            placeholder="Fornavn"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="adminLastName">Etternavn</Label>
                          <Input
                            id="adminLastName"
                            value={adminData.lastName}
                            onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                            placeholder="Etternavn"
                          />
                        </div>
                        <p className="col-span-2 text-xs text-muted-foreground">
                          Administrator vil motta en e-post med innloggingsinformasjon.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCompany ? "Lagre endringer" : "Opprett bedrift"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter bedrift..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Companies list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Bedrift</th>
                  <th className="text-left p-4 font-medium text-sm">Org.nummer</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Opprettet</th>
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
                ) : filteredCompanies?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Ingen bedrifter funnet
                    </td>
                  </tr>
                ) : (
                  filteredCompanies?.map((company) => (
                    <tr key={company.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.email && (
                              <p className="text-xs text-muted-foreground">{company.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {company.org_number || "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(company.status)}
                          {company.sg_approved && (
                            <Badge variant="default" className="bg-green-600 text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              SG
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {new Date(company.created_at).toLocaleDateString("nb-NO")}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(company)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Rediger
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleStatusMutation.mutate({ id: company.id, status: company.status })}
                            >
                              <Power className="w-4 h-4 mr-2" />
                              {company.status === "active" ? "Deaktiver" : "Aktiver"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/users?company=${company.id}`}>
                                <Users className="w-4 h-4 mr-2" />
                                Se brukere
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInviteAdmin(company)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Inviter admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setModulesCompany(company);
                              setModulesDialogOpen(true);
                            }}>
                              <Boxes className="w-4 h-4 mr-2" />
                              Moduler
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Er du sikker på at du vil slette denne bedriften?")) {
                                  deleteMutation.mutate(company.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Slett
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

        {/* Invite Admin Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
          setInviteDialogOpen(open);
          if (!open) {
            setInviteCompany(null);
            setAdminData({ email: "", firstName: "", lastName: "" });
          }
        }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Inviter administrator
              </DialogTitle>
            </DialogHeader>
            {inviteCompany && (
              <form onSubmit={submitInviteAdmin} className="space-y-4 mt-4">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Bedrift</p>
                  <p className="font-medium">{inviteCompany.name}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">E-post *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    placeholder="admin@bedrift.no"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteFirstName">Fornavn</Label>
                    <Input
                      id="inviteFirstName"
                      value={adminData.firstName}
                      onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                      placeholder="Fornavn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteLastName">Etternavn</Label>
                    <Input
                      id="inviteLastName"
                      value={adminData.lastName}
                      onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                      placeholder="Etternavn"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Administrator vil motta en e-post med innloggingsinformasjon.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={inviteAdminMutation.isPending} className="gap-2">
                    <Mail className="w-4 h-4" />
                    {inviteAdminMutation.isPending ? "Sender..." : "Send invitasjon"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Company Modules Dialog */}
        <CompanyModulesDialog
          open={modulesDialogOpen}
          onOpenChange={setModulesDialogOpen}
          company={modulesCompany}
        />
      </div>
    </AdminLayout>
  );
}
