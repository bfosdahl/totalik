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
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

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
            <p className="text-muted-foreground">Laster...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleSaveSupplier = async (supplierData: any) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...supplierData });
    } else {
      await createSupplier.mutateAsync(supplierData);
    }
    setEditingSupplier(null);
  };

  const handleEditSupplier = (supplier: any) => {
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
            <h1 className="text-3xl font-bold mb-2">Faste avtaler</h1>
            <p className="text-muted-foreground">
              Oversikt over leverandører og serviceavtaler
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
              Ingen faste avtaler funnet. Legg til leverandører eller kjør IK/MAT oppsettet for å generere anbefalte leverandøravtaler.
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
                    Leverandører og serviceavtaler du har registrert
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leverandør</TableHead>
                        <TableHead>Type tjeneste</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>Avtale slutt</TableHead>
                        <TableHead className="w-[100px]">Handlinger</TableHead>
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
                    AI-genererte forslag til leverandøravtaler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leverandør</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Frekvens</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>Neste gjennomgang</TableHead>
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
