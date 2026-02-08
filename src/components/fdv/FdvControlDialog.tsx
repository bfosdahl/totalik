import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FdvControl, FdvBuilding, FDV_CONTROL_TYPE_LABELS, FdvControlType } from "@/types/fdv";

const controlSchema = z.object({
  building_id: z.string().min(1, "Velg et bygg"),
  control_type: z.string().min(1, "Velg kontrolltype"),
  name: z.string().min(1, "Navn er påkrevd"),
  description: z.string().optional(),
  interval_months: z.coerce.number().min(1).default(12),
  responsible_name: z.string().optional(),
  next_due_date: z.string().optional(),
  reminder_enabled: z.boolean().default(true),
  reminder_days_before: z.coerce.number().min(1).default(14),
  notes: z.string().optional(),
});

type ControlFormData = z.infer<typeof controlSchema>;

interface FdvControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: FdvControl | null;
  buildings: FdvBuilding[];
  onSave: (data: Partial<FdvControl>) => Promise<void>;
}

export function FdvControlDialog({ open, onOpenChange, control, buildings, onSave }: FdvControlDialogProps) {
  const form = useForm<ControlFormData>({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      building_id: "",
      control_type: "",
      name: "",
      description: "",
      interval_months: 12,
      responsible_name: "",
      next_due_date: "",
      reminder_enabled: true,
      reminder_days_before: 14,
      notes: "",
    },
  });

  useEffect(() => {
    if (control) {
      form.reset({
        building_id: control.building_id,
        control_type: control.control_type,
        name: control.name,
        description: control.description || "",
        interval_months: control.interval_months,
        responsible_name: control.responsible_name || "",
        next_due_date: control.next_due_date || "",
        reminder_enabled: control.reminder_enabled,
        reminder_days_before: control.reminder_days_before,
        notes: control.notes || "",
      });
    } else {
      form.reset();
    }
  }, [control, form]);

  const onSubmit = async (data: ControlFormData) => {
    await onSave({
      ...data,
      control_type: data.control_type as FdvControlType,
      description: data.description || null,
      responsible_name: data.responsible_name || null,
      next_due_date: data.next_due_date || null,
      notes: data.notes || null,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{control ? "Rediger kontroll" : "Ny kontroll"}</DialogTitle>
          <DialogDescription>
            {control ? "Oppdater kontrollinformasjon" : "Legg til en ny kontroll"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="building_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bygg *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg bygg" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildings.filter(b => b.status === 'aktiv').map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="control_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontrolltype *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(FDV_CONTROL_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn *</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Årlig brannalarmservice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Beskrivelse av kontrollen..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interval_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intervall (måneder)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neste forfall</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="responsible_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ansvarlig</FormLabel>
                  <FormControl>
                    <Input placeholder="Navn på ansvarlig" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Påminnelse</p>
                <p className="text-sm text-muted-foreground">Send varsling før forfall</p>
              </div>
              <FormField
                control={form.control}
                name="reminder_enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("reminder_enabled") && (
              <FormField
                control={form.control}
                name="reminder_days_before"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dager før forfall</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notater</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Eventuelle notater..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit">
                {control ? "Lagre endringer" : "Opprett kontroll"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
