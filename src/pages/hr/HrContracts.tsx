import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Search, Loader2 } from "lucide-react";
import { useEmploymentContracts, EmploymentContract } from "@/hooks/useEmploymentContracts";
import { useAuth } from "@/contexts/AuthContext";
import { CreateContractDialog } from "@/components/hr/contracts/CreateContractDialog";
import { ContractSignatureDialog } from "@/components/hr/contracts/ContractSignatureDialog";
import { ContractCard } from "@/components/hr/contracts/ContractCard";
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

export default function HrContracts() {
  const { isCompanyAdmin } = useAuth();
  const { 
    contracts, 
    isLoading, 
    stats, 
    createContract, 
    signContract, 
    deleteContract 
  } = useEmploymentContracts();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [signatureDialog, setSignatureDialog] = useState<{
    open: boolean;
    contract: EmploymentContract | null;
    type: 'employee' | 'employer';
  }>({ open: false, contract: null, type: 'employer' });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    contract: EmploymentContract | null;
  }>({ open: false, contract: null });

  const filteredContracts = contracts.filter(contract => {
    if (!searchQuery) return true;
    const employeeName = contract.employee 
      ? `${contract.employee.first_name || ''} ${contract.employee.last_name || ''}`.toLowerCase()
      : '';
    return (
      employeeName.includes(searchQuery.toLowerCase()) ||
      contract.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateContract = (data: Parameters<typeof createContract.mutate>[0]) => {
    createContract.mutate(data, {
      onSuccess: () => setShowCreateDialog(false),
    });
  };

  const handleSign = (signature: string) => {
    if (signatureDialog.contract) {
      signContract.mutate({
        id: signatureDialog.contract.id,
        signatureType: signatureDialog.type,
        signature,
      }, {
        onSuccess: () => setSignatureDialog({ open: false, contract: null, type: 'employer' }),
      });
    }
  };

  const handleDelete = () => {
    if (deleteDialog.contract) {
      deleteContract.mutate(deleteDialog.contract.id, {
        onSuccess: () => setDeleteDialog({ open: false, contract: null }),
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ansettelsesavtaler</h1>
            <p className="text-muted-foreground mt-1">
              Administrer arbeidsavtaler og ansettelsesdokumenter
            </p>
          </div>
          {isCompanyAdmin && (
            <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" />
              Ny avtale
            </Button>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.totalActive}</div>
            <div className="text-sm text-muted-foreground">Totalt aktive</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.temporary}</div>
            <div className="text-sm text-muted-foreground">Midlertidige</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.onProbation}</div>
            <div className="text-sm text-muted-foreground">Under prøvetid</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{stats.expiringSoon}</div>
            <div className="text-sm text-muted-foreground">Utgår snart</div>
          </Card>
        </div>

        {/* Search */}
        {contracts.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter ansatt eller stilling..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Contracts list */}
        {!isLoading && filteredContracts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                canManage={isCompanyAdmin}
                onView={(c) => setSignatureDialog({ open: true, contract: c, type: 'employer' })}
                onSignAsEmployer={(c) => setSignatureDialog({ open: true, contract: c, type: 'employer' })}
                onDelete={(c) => setDeleteDialog({ open: true, contract: c })}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && contracts.length === 0 && (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen ansettelsesavtaler enda</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Start med å legge til en ny avtale for å holde oversikt over alle ansettelsesforhold
              </p>
              {isCompanyAdmin && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Legg til første avtale
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* No results */}
        {!isLoading && contracts.length > 0 && filteredContracts.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              Ingen avtaler matcher søket ditt
            </div>
          </Card>
        )}
      </div>

      {/* Create Contract Dialog */}
      <CreateContractDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateContract}
        isSubmitting={createContract.isPending}
      />

      {/* Signature Dialog */}
      <ContractSignatureDialog
        open={signatureDialog.open}
        onOpenChange={(open) => !open && setSignatureDialog({ open: false, contract: null, type: 'employer' })}
        contract={signatureDialog.contract}
        signatureType={signatureDialog.type}
        onSign={handleSign}
        isSigning={signContract.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, contract: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett avtale?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne avtalen? Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
