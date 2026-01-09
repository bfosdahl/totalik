import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Hash,
  Check,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  org_number: string | null;
  is_active: boolean;
  created_at: string;
}

interface CompanyDepartmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: { id: string; name: string } | null;
}

export function CompanyDepartmentsDialog({
  open,
  onOpenChange,
  company,
}: CompanyDepartmentsDialogProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    postal_code: "",
    org_number: "",
  });

  useEffect(() => {
    if (open && company) {
      fetchDepartments();
    }
  }, [open, company]);

  const fetchDepartments = async () => {
    if (!company) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_departments")
        .select("*")
        .eq("company_id", company.id)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Kunne ikke hente avdelinger");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      city: "",
      postal_code: "",
      org_number: "",
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!company || !formData.name.trim()) {
      toast.error("Navn er påkrevd");
      return;
    }

    try {
      const { error } = await supabase.from("company_departments").insert({
        company_id: company.id,
        name: formData.name.trim(),
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        org_number: formData.org_number || null,
        is_active: true,
      });

      if (error) throw error;
      toast.success("Avdeling opprettet");
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Kunne ikke opprette avdeling");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) {
      toast.error("Navn er påkrevd");
      return;
    }

    try {
      const { error } = await supabase
        .from("company_departments")
        .update({
          name: formData.name.trim(),
          description: formData.description || null,
          address: formData.address || null,
          city: formData.city || null,
          postal_code: formData.postal_code || null,
          org_number: formData.org_number || null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Avdeling oppdatert");
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Kunne ikke oppdatere avdeling");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne avdelingen?")) return;

    try {
      const { error } = await supabase
        .from("company_departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Avdeling slettet");
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Kunne ikke slette avdeling");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("company_departments")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Avdeling deaktivert" : "Avdeling aktivert");
      fetchDepartments();
    } catch (error) {
      console.error("Error toggling department status:", error);
      toast.error("Kunne ikke endre status");
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      address: dept.address || "",
      city: dept.city || "",
      postal_code: dept.postal_code || "",
      org_number: dept.org_number || "",
    });
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Avdelinger for {company?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Add new button */}
          {!isCreating && !editingId && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Legg til avdeling
            </Button>
          )}

          {/* Create/Edit form */}
          {(isCreating || editingId) && (
            <div className="p-4 border border-border rounded-lg bg-secondary/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Avdelingsnavn"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Kort beskrivelse"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org_number">Org.nummer</Label>
                  <Input
                    id="org_number"
                    value={formData.org_number}
                    onChange={(e) =>
                      setFormData({ ...formData, org_number: e.target.value })
                    }
                    placeholder="123 456 789"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Gateadresse"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal_code">Postnr</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) =>
                      setFormData({ ...formData, postal_code: e.target.value })
                    }
                    placeholder="0001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Sted</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Oslo"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  Avbryt
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    editingId ? handleUpdate(editingId) : handleCreate()
                  }
                >
                  {editingId ? "Lagre" : "Opprett"}
                </Button>
              </div>
            </div>
          )}

          {/* Departments list */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Laster avdelinger...
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ingen avdelinger</p>
                <p className="text-sm">
                  Denne bedriften har ikke opprettet avdelinger ennå.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      dept.is_active
                        ? "border-border bg-card"
                        : "border-border/50 bg-muted/30 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{dept.name}</h4>
                          <Badge
                            variant={dept.is_active ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {dept.is_active ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </div>
                        {dept.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {dept.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {dept.org_number && (
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {dept.org_number}
                            </span>
                          )}
                          {(dept.address || dept.city) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[dept.address, dept.postal_code, dept.city]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleToggleActive(dept.id, dept.is_active)
                          }
                          title={dept.is_active ? "Deaktiver" : "Aktiver"}
                        >
                          {dept.is_active ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(dept)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(dept.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
