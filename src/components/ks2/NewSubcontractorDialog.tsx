import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKsModule2Subcontractors, NewSubcontractorInput } from "@/hooks/useKsModule2Subcontractors";

const TRADES = [
  "Tømrer",
  "Rørlegger",
  "Elektriker",
  "Maler",
  "Murer",
  "Betong",
  "Taktekker",
  "Ventilasjon",
  "Våtrom",
  "Kjøkken",
  "Grunnarbeid",
  "Annet",
];

interface NewSubcontractorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function NewSubcontractorDialog({ 
  open, 
  onOpenChange, 
  projectId 
}: NewSubcontractorDialogProps) {
  const { createSubcontractor, isCreating } = useKsModule2Subcontractors(projectId);
  const [trade, setTrade] = useState<string>("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewSubcontractorInput>();

  const onSubmit = (data: NewSubcontractorInput) => {
    createSubcontractor(
      { ...data, trade: trade || undefined },
      {
        onSuccess: () => {
          reset();
          setTrade("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Ny underleverandør
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firm_name">Firmanavn *</Label>
            <Input
              id="firm_name"
              {...register("firm_name", { required: "Firmanavn er påkrevd" })}
              placeholder="Firma AS"
            />
            {errors.firm_name && (
              <p className="text-sm text-destructive">{errors.firm_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="org_number">Org.nummer</Label>
            <Input
              id="org_number"
              {...register("org_number")}
              placeholder="123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_scope">Arbeidsomfang *</Label>
            <Textarea
              id="work_scope"
              {...register("work_scope", { required: "Arbeidsomfang er påkrevd" })}
              placeholder="Beskriv arbeidet som skal utføres..."
              rows={3}
            />
            {errors.work_scope && (
              <p className="text-sm text-destructive">{errors.work_scope.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fagområde</Label>
            <Select value={trade} onValueChange={setTrade}>
              <SelectTrigger>
                <SelectValue placeholder="Velg fagområde" />
              </SelectTrigger>
              <SelectContent>
                {TRADES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdato</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Sluttdato</Label>
              <Input
                id="end_date"
                type="date"
                {...register("end_date")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_value">Kontraktsverdi (kr)</Label>
            <Input
              id="contract_value"
              type="number"
              {...register("contract_value", { valueAsNumber: true })}
              placeholder="0"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-sm">Kontaktperson</h4>
            
            <div className="space-y-2">
              <Label htmlFor="contact_person">Navn</Label>
              <Input
                id="contact_person"
                {...register("contact_person")}
                placeholder="Ola Nordmann"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input
                  id="contact_phone"
                  {...register("contact_phone")}
                  placeholder="123 45 678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-post</Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register("contact_email")}
                  placeholder="kontakt@firma.no"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Lagrer..." : "Registrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
