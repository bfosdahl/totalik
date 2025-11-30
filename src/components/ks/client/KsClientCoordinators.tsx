import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KsProjectCoordinator } from "@/hooks/useKsProjectClient";
import { Users, Plus, Trash2, Edit2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KsClientCoordinatorsProps {
  coordinators: KsProjectCoordinator[];
  onSave: (data: Partial<KsProjectCoordinator>) => void;
  onDelete: (id: string) => void;
}

export function KsClientCoordinators({ coordinators, onSave, onDelete }: KsClientCoordinatorsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    role_type: "KP",
    coordinator_name: "",
    coordinator_company: "",
    phone: "",
    email: "",
  });

  const resetForm = () => {
    setFormData({
      role_type: "KP",
      coordinator_name: "",
      coordinator_company: "",
      phone: "",
      email: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editingId ? { ...formData, id: editingId } : formData);
    resetForm();
  };

  const handleEdit = (coordinator: KsProjectCoordinator) => {
    setFormData({
      role_type: coordinator.role_type,
      coordinator_name: coordinator.coordinator_name,
      coordinator_company: coordinator.coordinator_company || "",
      phone: coordinator.phone || "",
      email: coordinator.email || "",
    });
    setEditingId(coordinator.id);
    setIsAdding(true);
  };

  const getRoleLabel = (roleType: string) => {
    switch (roleType) {
      case "KP":
        return "Koordinator Prosjektering";
      case "KU":
        return "Koordinator Utførelse";
      default:
        return roleType;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Byggherreforskriften - Koordinatorer
        </CardTitle>
        <CardDescription>
          Registrer koordinatorer for prosjektering (KP) og utførelse (KU) i henhold til byggherreforskriften
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of coordinators */}
        <div className="space-y-2">
          {coordinators.map((coordinator) => (
            <div
              key={coordinator.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{coordinator.role_type}</Badge>
                  <span className="font-medium">{coordinator.coordinator_name}</span>
                </div>
                {coordinator.coordinator_company && (
                  <p className="text-sm text-muted-foreground">{coordinator.coordinator_company}</p>
                )}
                <div className="text-sm text-muted-foreground">
                  {coordinator.phone && <span className="mr-3">{coordinator.phone}</span>}
                  {coordinator.email && <span>{coordinator.email}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(coordinator)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Er du sikker på at du vil slette denne koordinatoren?")) {
                      onDelete(coordinator.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">
                {editingId ? "Rediger koordinator" : "Legg til koordinator"}
              </h4>
              <Button type="button" variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_type">Rolle *</Label>
                <Select
                  value={formData.role_type}
                  onValueChange={(value) => setFormData({ ...formData, role_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KP">Koordinator Prosjektering (KP)</SelectItem>
                    <SelectItem value="KU">Koordinator Utførelse (KU)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinator_name">Navn *</Label>
                <Input
                  id="coordinator_name"
                  value={formData.coordinator_name}
                  onChange={(e) => setFormData({ ...formData, coordinator_name: e.target.value })}
                  placeholder="Navn på koordinator"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="coordinator_company">Firma</Label>
                <Input
                  id="coordinator_company"
                  value={formData.coordinator_company}
                  onChange={(e) => setFormData({ ...formData, coordinator_company: e.target.value })}
                  placeholder="Firmanavn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Telefonnummer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="E-postadresse"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? "Lagre endringer" : "Legg til"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Avbryt
              </Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Legg til koordinator
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
