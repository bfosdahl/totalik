import { useState, useEffect } from "react";
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
  Upload,
  RefreshCw,
  Building,
  Sparkles,
  X,
  CalendarOff,
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
import { BulkCompanyImportDialog } from "@/components/admin/BulkCompanyImportDialog";
import { CompanyDepartmentsDialog } from "@/components/admin/CompanyDepartmentsDialog";
import { applyDefaultHmsSetup } from "@/lib/applyDefaultHmsSetup";
import { applyImportedHmsSetup, getImportedHmsData, clearImportedHmsData, type ImportedHmsData } from "@/lib/applyImportedHmsSetup";
import { getModuleDefaultSettings } from "@/lib/moduleDefaults";
import { SelectableCard } from "@/components/ui/selectable-card";
import { ResetDeviationsDialog } from "@/components/admin/ResetDeviationsDialog";
import { t } from "@/i18n/t";
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

export default function AdminCompanies() {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
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
  
  // Module selection for new company
  const [selectedModules, setSelectedModules] = useState<string[]>(["IK_HMS"]);
  
  // Modules dialog state
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [modulesCompany, setModulesCompany] = useState<any>(null);
  
  // Departments dialog state
  const [departmentsDialogOpen, setDepartmentsDialogOpen] = useState(false);
  const [departmentsCompany, setDepartmentsCompany] = useState<any>(null);
  
  // Bulk import dialog state
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  
  // Reset deviations dialog state
  const [resetDeviationsOpen, setResetDeviationsOpen] = useState(false);
  const [resetDeviationsCompany, setResetDeviationsCompany] = useState<any>(null);
  
  // PDF import data state
  const [importedData, setImportedData] = useState<ImportedHmsData | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check for imported PDF data on mount
  useEffect(() => {
    const data = getImportedHmsData();
    if (data) {
      setImportedData(data);
      // Pre-fill form with imported data
      setFormData(prev => ({
        ...prev,
        name: data.firmanavn || prev.name,
        org_number: data.organisasjonsnummer || prev.org_number,
        email: data.epost || prev.email,
        phone: data.telefon || prev.phone,
      }));
      // Auto-open dialog with prefilled data
      setIsDialogOpen(true);
      toast({
        title: t("auto.pdf_data_klar"),
        description: `Bedriftsinfo fra "${data.firmanavn}" er forhåndsutfylt. Verifiser og opprett bedriften.`,
      });
    }
  }, []);

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, name, org_number, address, city, postal_code, phone, email, status, created_at, employee_count, brreg_employee_count, has_departments, seller_id, industries, sg_approved, sg_expiry_date, sg_approval_areas"
        )
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // 1. Create the company
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
      
      // 2. Create all selected modules for the new company (modules first, seeding after)
      const moduleErrors: string[] = [];
      const createdModules: string[] = [];
      
      for (const moduleType of selectedModules) {
        const { error: moduleError } = await supabase.from("company_modules").insert({
          company_id: newCompany.id,
          module_type: moduleType,
          is_active: true,
          settings: getModuleDefaultSettings(moduleType),
        });
        
        if (moduleError) {
          console.error(`Error creating ${moduleType} module:`, moduleError);
          moduleErrors.push(`${moduleType}: ${moduleError.message}`);
        } else {
          createdModules.push(moduleType);
        }
      }
      
      if (moduleErrors.length > 0) {
        throw new Error(`Kunne ikke opprette moduler: ${moduleErrors.join(", ")}`);
      }
      
      // 3. Run post-module setup (seeding, HMS setup) AFTER all modules are created
      // This prevents race conditions and ensures modules exist before seeding
      const postSetupPromises: Promise<void>[] = [];
      
      // KS Bygg seed projects (run in background, don't block)
      if (createdModules.includes("IK_BYGG")) {
        postSetupPromises.push(
          import("@/utils/ksModule2SeedProjects")
            .then(({ createSeedProjects }) => createSeedProjects(newCompany.id))
            .then(() => { /* success */ })
            .catch((err) => console.error("Error creating seed projects:", err))
        );
      }
      
      // HMS setup - use imported data if available, otherwise use defaults
      if (createdModules.includes("IK_HMS")) {
        const currentImportedData = getImportedHmsData();
        if (currentImportedData) {
          console.log('[AdminCompanies] Using imported PDF data for HMS setup');
          postSetupPromises.push(
            applyImportedHmsSetup(newCompany.id, currentImportedData)
              .then((result) => {
                if (!result.success) {
                  console.error("Error applying imported HMS setup:", result.error);
                }
              })
              .catch((err) => console.error("Error in imported HMS setup:", err))
          );
        } else {
          console.log('[AdminCompanies] Using default HMS setup');
          postSetupPromises.push(
            applyDefaultHmsSetup(newCompany.id)
              .then((result) => {
                if (!result.success) {
                  console.error("Error applying default HMS setup:", result.error);
                }
              })
              .catch((err) => console.error("Error in HMS setup:", err))
          );
        }
      }
      
      // Wait for all post-setup tasks to complete (but they won't throw)
      await Promise.all(postSetupPromises);
      
      return newCompany;
    },
    onSuccess: async (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setIsDialogOpen(false);
      
      // Automatisk synkroniser til kurssystemet
      try {
        await supabase.functions.invoke("sync-to-kurs", {
          body: { company_id: newCompany.id },
        });
        
      } catch (syncError) {
        console.error("Failed to sync to kurs:", syncError);
      }
      
      // If inviting admin, call the edge function
      if (inviteAdmin && adminData.email) {
        try {
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
              title: t("auto.bedrift_opprettet"), 
              description: `Bedrift opprettet og synkronisert, men kunne ikke invitere admin: ${response.error.message}`,
              variant: "destructive"
            });
          } else {
            toast({ 
              title: t("auto.bedrift_opprettet"), 
              description: t("auto.bedrift_opprettet_synkronisert_til_kurss") 
            });
          }
        } catch (err: any) {
          toast({ 
            title: t("auto.bedrift_opprettet"), 
            description: `Bedrift opprettet og synkronisert, men kunne ikke invitere admin: ${err.message}`,
            variant: "destructive"
          });
        }
      } else {
        toast({ title: t("auto.bedrift_opprettet"), description: t("auto.ny_bedrift_er_lagt_til_og_synkronisert_t") });
      }
      
      resetForm();
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
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
      toast({ title: t("auto.administrator_invitert"), description: t("auto.e_post_sendt_til_ny_administrator") });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
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
      toast({ title: t("auto.bedrift_oppdatert") });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
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
      toast({ title: t("auto.bedrift_slettet") });
    },
    onError: (error) => {
      toast({ title: t("auto.feil"), description: error.message, variant: "destructive" });
    },
  });

  const syncToKursMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await supabase.functions.invoke("sync-to-kurs", {
        body: { company_id: companyId },
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      toast({ 
        title: t("auto.synkronisert"), 
        description: `Bedrift og ansatte synkronisert til kurssystemet.` 
      });
    },
    onError: (error) => {
      toast({ title: t("auto.synkroniseringsfeil"), description: error.message, variant: "destructive" });
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
    setSelectedModules(["IK_HMS"]);
    // Clear imported data when form is reset
    clearImportedHmsData();
    setImportedData(null);
  };
  
  const toggleModuleSelection = (moduleType: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleType) 
        ? prev.filter(m => m !== moduleType)
        : [...prev, moduleType]
    );
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

    // Logic guard: Hvis bedriften har en kontakt-e-post, MÅ vi også opprette en admin-bruker.
    // Hindrer "spøkelsesbedrifter" der kontakt-epost ligger på bedriften uten en faktisk bruker som kan logge inn.
    if (!editingCompany && formData.email && formData.email.trim().length > 0) {
      if (!inviteAdmin) {
        toast({
          title: t("auto.mangler_admin_bruker"),
          description: t("auto.bedriften_har_en_kontakt_e_post_kryss_av"),
          variant: "destructive",
        });
        return;
      }
      if (!adminData.email || !adminData.firstName?.trim() || !adminData.lastName?.trim()) {
        toast({
          title: t("auto.mangler_navn_paa_admin"),
          description: t("auto.fyll_inn_e_post_fornavn_og_etternavn_paa"),
          variant: "destructive",
        });
        return;
      }
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

  const totalFiltered = filteredCompanies?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCompanies = filteredCompanies?.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // Reset to page 1 when search or pageSize changes — guard to avoid redundant updates
  useEffect(() => {
    setCurrentPage((prev) => (prev === 1 ? prev : 1));
  }, [search, pageSize]);

  // Keep currentPage in valid range without causing render loops
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">{t("auto.aktiv")}</Badge>;
      case "inactive":
        return <Badge variant="secondary">{t("auto.inaktiv")}</Badge>;
      case "suspended":
        return <Badge variant="destructive">{t("auto.suspendert")}</Badge>;
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auto.bedrifter")}</h1>
            <p className="text-muted-foreground">
              {t("auto.administrer_bedrifter_og_lisenser")}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none"
              onClick={() => setBulkImportOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
            <Button 
              className="flex-1 sm:flex-none"
              onClick={() => {
                setEditingCompany(null);
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("auto.ny_bedrift")}
            </Button>
          </div>
        </motion.div>

        {/* Create/Edit Company Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCompany(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? "Rediger bedrift" : "Opprett ny bedrift"}
                </DialogTitle>
              </DialogHeader>
              
              {/* PDF Import indicator */}
              {!editingCompany && importedData && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-primary">{t("auto.pdf_data_forhaandsutfylt")}</span>
                    <span className="text-muted-foreground ml-1">
                      ({importedData.farekilder?.length || 0} farekilder, {importedData.hmsmal?.length || 0} mål)
                    </span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      clearImportedHmsData();
                      setImportedData(null);
                      toast({ title: t("auto.pdf_data_fjernet"), description: t("auto.standardoppsett_vil_bli_brukt") });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">{t("auto.bedriftsnavn_2")}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t("auto.bedrift_as")}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org_number">{t("auto.org_nummer")}</Label>
                    <Input
                      id="org_number"
                      value={formData.org_number}
                      onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                      placeholder="123 456 789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("auto.telefon")}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+47 123 45 678"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="email">{t("auto.e_post_2")}</Label>
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
                    <Label htmlFor="address">{t("auto.adresse")}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={t("auto.gateadresse_1")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">{t("auto.postnummer")}</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="0001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("auto.sted")}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder={t("auto.oslo")}
                    />
                  </div>
                </div>
                
                {/* Module selection section - only for new companies */}
                {!editingCompany && (
                  <div className="border-t border-border pt-4 mt-4">
                    <Label className="text-sm font-medium mb-3 block">{t("auto.velg_moduler")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {MODULE_OPTIONS.map((module) => (
                        <SelectableCard
                          key={module.type}
                          selected={selectedModules.includes(module.type)}
                          onSelectedChange={() => toggleModuleSelection(module.type)}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{module.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                          </div>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>
                )}
                
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
                        {t("auto.inviter_bedriftsadministrator")}
                      </Label>
                    </div>
                    
                    {inviteAdmin && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="adminEmail">{t("auto.administrator_e_post")}</Label>
                          <Input
                            id="adminEmail"
                            type="email"
                            value={adminData.email}
                            onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                            placeholder="admin@bedrift.no"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="adminFirstName">{t("auto.fornavn")}</Label>
                          <Input
                            id="adminFirstName"
                            value={adminData.firstName}
                            onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                            placeholder={t("auto.fornavn")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="adminLastName">{t("auto.etternavn")}</Label>
                          <Input
                            id="adminLastName"
                            value={adminData.lastName}
                            onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                            placeholder={t("auto.etternavn")}
                          />
                        </div>
                        <p className="col-span-2 text-xs text-muted-foreground">
                          {t("auto.administrator_vil_motta_en_e_post_med_in")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("auto.avbryt")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCompany ? "Lagre endringer" : "Opprett bedrift"}
                  </Button>
                </div>
              </form>
            </DialogContent>
        </Dialog>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("auto.soek_etter_bedrift")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Companies list - Desktop */}
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
                  <th className="text-left p-4 font-medium text-sm">{t("auto.bedrift")}</th>
                  <th className="text-left p-4 font-medium text-sm">{t("auto.org_nummer")}</th>
                  <th className="text-left p-4 font-medium text-sm">{t("auto.status_2")}</th>
                  <th className="text-left p-4 font-medium text-sm">{t("auto.opprettet_2")}</th>
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
                ) : filteredCompanies?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {t("auto.ingen_bedrifter_funnet")}
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies?.map((company) => (
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
                              {t("auto.rediger")}
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
                            <DropdownMenuItem onClick={() => {
                              setDepartmentsCompany(company);
                              setDepartmentsDialogOpen(true);
                            }}>
                              <Building className="w-4 h-4 mr-2" />
                              Avdelinger
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => syncToKursMutation.mutate(company.id)}
                              disabled={syncToKursMutation.isPending}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${syncToKursMutation.isPending ? 'animate-spin' : ''}`} />
                              Synk til kurssystem
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setResetDeviationsCompany(company);
                              setResetDeviationsOpen(true);
                            }}>
                              <CalendarOff className="w-4 h-4 mr-2" />
                              Nullstill avvik
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
                              {t("auto.slett")}
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

          {/* Pagination controls */}
          {totalFiltered > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("auto.vis")}</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>{t("auto.per_side")}</span>
                <span className="ml-2">
                  ({(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalFiltered)} av {totalFiltered})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Forrige
                </Button>
                <span className="px-3 text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t("auto.neste")}
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Companies list - Mobile */}
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
          ) : filteredCompanies?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
              {t("auto.ingen_bedrifter_funnet")}
            </div>
          ) : (
            paginatedCompanies?.map((company) => (
              <div
                key={company.id}
                className="bg-card rounded-xl border border-border p-4 space-y-3"
              >
                {/* Company info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{company.name}</p>
                      {company.email && (
                        <p className="text-xs text-muted-foreground truncate">{company.email}</p>
                      )}
                      {company.org_number && (
                        <p className="text-xs text-muted-foreground">Org: {company.org_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {getStatusBadge(company.status)}
                    {company.sg_approved && (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        SG
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Created date */}
                <div className="text-xs text-muted-foreground">
                  Opprettet: {new Date(company.created_at).toLocaleDateString("nb-NO")}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(company)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t("auto.rediger")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModulesCompany(company);
                        setModulesDialogOpen(true);
                      }}
                      className="w-full"
                    >
                      <Boxes className="w-4 h-4 mr-2" />
                      Moduler
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDepartmentsCompany(company);
                        setDepartmentsDialogOpen(true);
                      }}
                      className="w-full"
                    >
                      <Building className="w-4 h-4 mr-2" />
                      Avdelinger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInviteAdmin(company)}
                      className="w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Inviter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full"
                    >
                      <Link to={`/admin/users?company=${company.id}`}>
                        <Users className="w-4 h-4 mr-2" />
                        Brukere
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: company.id, status: company.status })}
                      className="w-full"
                    >
                      <Power className="w-4 h-4 mr-2" />
                      {company.status === "active" ? "Deaktiver" : "Aktiver"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Er du sikker på at du vil slette denne bedriften?")) {
                          deleteMutation.mutate(company.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("auto.slett")}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
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
                  <p className="text-sm text-muted-foreground">{t("auto.bedrift")}</p>
                  <p className="font-medium">{inviteCompany.name}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">{t("auto.e_post")}</Label>
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
                    <Label htmlFor="inviteFirstName">{t("auto.fornavn")}</Label>
                    <Input
                      id="inviteFirstName"
                      value={adminData.firstName}
                      onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
                      placeholder={t("auto.fornavn")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteLastName">{t("auto.etternavn")}</Label>
                    <Input
                      id="inviteLastName"
                      value={adminData.lastName}
                      onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
                      placeholder={t("auto.etternavn")}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("auto.administrator_vil_motta_en_e_post_med_in")}
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    {t("auto.avbryt")}
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
        
        {/* Bulk Company Import Dialog */}
        <BulkCompanyImportDialog
          open={bulkImportOpen}
          onOpenChange={setBulkImportOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-companies"] })}
        />

        {/* Company Departments Dialog */}
        <CompanyDepartmentsDialog
          open={departmentsDialogOpen}
          onOpenChange={setDepartmentsDialogOpen}
          company={departmentsCompany}
        />

        {/* Reset Deviations Dialog */}
        <ResetDeviationsDialog
          open={resetDeviationsOpen}
          onOpenChange={setResetDeviationsOpen}
          company={resetDeviationsCompany}
        />
      </div>
    </AdminLayout>
  );
}
