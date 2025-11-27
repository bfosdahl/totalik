import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { Loader2 } from "lucide-react";
import type { NewAuditInput } from "@/hooks/useAudits";

interface NewAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewAuditInput) => Promise<any>;
}

export function NewAuditDialog({ open, onOpenChange, onSubmit }: NewAuditDialogProps) {
  const { users } = useCompanyUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "internal" as "internal" | "external" | "routine",
    scheduled_date: "",
    area: "",
    responsible_id: "",
    description: "",
    checklist_total: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_date) return;

    setIsSubmitting(true);
    const selectedUser = users.find(u => u.id === formData.responsible_id);
    
    await onSubmit({
      ...formData,
      responsible_name: selectedUser 
        ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() 
        : undefined,
    });
    
    setIsSubmitting(false);
    setFormData({
      title: "",
      type: "internal",
      scheduled_date: "",
      area: "",
      responsible_id: "",
      description: "",
      checklist_total: 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ny revisjon</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="F.eks. Årlig HMS-revisjon"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: "internal" | "external" | "routine") => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Intern</SelectItem>
                  <SelectItem value="external">Ekstern</SelectItem>
                  <SelectItem value="routine">Rutine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Dato *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Område</Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="F.eks. Hele bedriften, Produksjon, Kontor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Ansvarlig</Label>
            <Select 
              value={formData.responsible_id} 
              onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg ansvarlig" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checklist_total">Antall sjekkpunkter</Label>
            <Input
              id="checklist_total"
              type="number"
              min="0"
              value={formData.checklist_total || ""}
              onChange={(e) => setFormData({ ...formData, checklist_total: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beskriv formål og omfang av revisjonen"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title || !formData.scheduled_date}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opprett revisjon
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
