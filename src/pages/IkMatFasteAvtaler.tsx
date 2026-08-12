import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIkMatSuppliers } from "@/hooks/useIkMatSuppliers";
import { AddSupplierDialog } from "@/components/ikmat/AddSupplierDialog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { t } from "@/i18n/t";

interface Contract {
  supplier: string;
  type: string;
  frequency: string;
  contact: string;
  nextReview: string;
}

const IkMatFasteAvtaler = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { hasModule, modules, isLoading } = useCompanyModules();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const { suppliers, isLoading: suppliersLoading, createSupplier, updateSupplier, deleteSupplier } = useIkMatSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<typeof suppliers[0] | null>(null);

  useEffect(() => {
    if (!isLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }

    // Hent genererte faste avtaler fra company_modules settings
    if (!isLoading && modules.length > 0) {
      const ikMatModule = modules.find(m => m.module_type === 'IK_MAT');
      if (ikMatModule?.settings) {
        const settings = ikMatModule.settings as any;
        if (settings.generatedContent?.contracts) {
          setContracts(settings.generatedContent.contracts);
        }
      }
    }
  }, [hasModule, isLoading, navigate, modules]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("auto.laster")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleSaveSupplier = async (supplierData: Omit<typeof suppliers[0], "id" | "company_id" | "created_at" | "updated_at">) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...supplierData });
    } else {
      await createSupplier.mutateAsync(supplierData);
    }
    setEditingSupplier(null);
  };

  const handleEditSupplier = (supplier: typeof suppliers[0]) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne leverandøren?")) {
      await deleteSupplier.mutateAsync(id);
    }
  };

  const totalSuppliers = suppliers.length + contracts.length;

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("auto.faste_avtaler")}</h1>
            <p className="text-muted-foreground">
              {t("auto.oversikt_over_leverandoerer_og_serviceav")}
            </p>
          </div>
          <Button onClick={() => {
            setEditingSupplier(null);
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Legg til leverandør
          </Button>
        </div>

        {totalSuppliers === 0 ? (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              {t("auto.ingen_faste_avtaler_funnet_legg_til_leve")}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Brukerdefinerte leverandører */}
            {suppliers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Dine leverandører ({suppliers.length})</CardTitle>
                  <CardDescription>
                    {t("auto.leverandoerer_og_serviceavtaler_du_har_r")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("auto.leverandoer")}</TableHead>
                        <TableHead>{t("auto.type_tjeneste")}</TableHead>
                        <TableHead>{t("auto.kontakt")}</TableHead>
                        <TableHead>{t("auto.avtale_slutt")}</TableHead>
                        <TableHead className="w-[100px]">{t("auto.handlinger")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{supplier.service_type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {supplier.contact_person && <div>{supplier.contact_person}</div>}
                            {supplier.phone && <div className="text-muted-foreground">{supplier.phone}</div>}
                            {supplier.email && <div className="text-muted-foreground">{supplier.email}</div>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {supplier.contract_end_date 
                              ? format(new Date(supplier.contract_end_date), "dd.MM.yyyy", { locale: nb })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSupplier(supplier)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSupplier(supplier.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* AI-genererte faste avtaler */}
            {contracts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Anbefalte avtaler ({contracts.length})</CardTitle>
                  <CardDescription>
                    {t("auto.ai_genererte_forslag_til_leverandoeravta")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("auto.leverandoer")}</TableHead>
                        <TableHead>{t("auto.type")}</TableHead>
                        <TableHead>{t("auto.frekvens_2")}</TableHead>
                        <TableHead>{t("auto.kontakt")}</TableHead>
                        <TableHead>{t("auto.neste_gjennomgang")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{contract.supplier}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{contract.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{contract.frequency}</TableCell>
                          <TableCell className="text-sm">{contract.contact}</TableCell>
                          <TableCell className="text-sm">{contract.nextReview}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <AddSupplierDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveSupplier}
          editingSupplier={editingSupplier}
        />
      </div>
    </AppLayout>
  );
};

export default IkMatFasteAvtaler;
