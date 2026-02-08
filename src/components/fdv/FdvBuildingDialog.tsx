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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FdvBuilding, FDV_BUILDING_TYPE_LABELS, FDV_OWNER_TYPE_LABELS, FDV_USAGE_TYPE_LABELS } from "@/types/fdv";

const buildingSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  owner_type: z.enum(["eier", "leietaker"]),
  building_type: z.enum(["kontor", "butikk", "lager", "verksted", "kombinasjon"]),
  area_sqm: z.coerce.number().optional(),
  floors: z.coerce.number().min(1).default(1),
  usage_type: z.enum(["ansatte", "publikum", "begge"]),
  internal_contact_name: z.string().optional(),
  internal_contact_phone: z.string().optional(),
  internal_contact_email: z.string().email().optional().or(z.literal("")),
  external_contact_name: z.string().optional(),
  external_contact_phone: z.string().optional(),
  external_contact_email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["aktiv", "inaktiv"]).default("aktiv"),
});

type BuildingFormData = z.infer<typeof buildingSchema>;

interface FdvBuildingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: FdvBuilding | null;
  onSave: (data: Partial<FdvBuilding>) => Promise<void>;
}

export function FdvBuildingDialog({ open, onOpenChange, building, onSave }: FdvBuildingDialogProps) {
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      postal_code: "",
      owner_type: "eier",
      building_type: "kontor",
      area_sqm: undefined,
      floors: 1,
      usage_type: "ansatte",
      internal_contact_name: "",
      internal_contact_phone: "",
      internal_contact_email: "",
      external_contact_name: "",
      external_contact_phone: "",
      external_contact_email: "",
      notes: "",
      status: "aktiv",
    },
  });

  useEffect(() => {
    if (building) {
      form.reset({
        name: building.name,
        address: building.address || "",
        city: building.city || "",
        postal_code: building.postal_code || "",
        owner_type: building.owner_type,
        building_type: building.building_type,
        area_sqm: building.area_sqm || undefined,
        floors: building.floors,
        usage_type: building.usage_type,
        internal_contact_name: building.internal_contact_name || "",
        internal_contact_phone: building.internal_contact_phone || "",
        internal_contact_email: building.internal_contact_email || "",
        external_contact_name: building.external_contact_name || "",
        external_contact_phone: building.external_contact_phone || "",
        external_contact_email: building.external_contact_email || "",
        notes: building.notes || "",
        status: building.status,
      });
    } else {
      form.reset();
    }
  }, [building, form]);

  const onSubmit = async (data: BuildingFormData) => {
    await onSave({
      ...data,
      address: data.address || null,
      city: data.city || null,
      postal_code: data.postal_code || null,
      area_sqm: data.area_sqm || null,
      internal_contact_name: data.internal_contact_name || null,
      internal_contact_phone: data.internal_contact_phone || null,
      internal_contact_email: data.internal_contact_email || null,
      external_contact_name: data.external_contact_name || null,
      external_contact_phone: data.external_contact_phone || null,
      external_contact_email: data.external_contact_email || null,
      notes: data.notes || null,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{building ? "Rediger bygg" : "Nytt bygg"}</DialogTitle>
          <DialogDescription>
            {building ? "Oppdater informasjon om bygget" : "Legg til et nytt bygg i systemet"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium">Grunnleggende informasjon</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Byggnavn *</FormLabel>
                    <FormControl>
                      <Input placeholder="F.eks. Hovedkontor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="Gateadresse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postnr</FormLabel>
                      <FormControl>
                        <Input placeholder="0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>By</FormLabel>
                    <FormControl>
                      <Input placeholder="Poststed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Building Details */}
            <div className="space-y-4">
              <h3 className="font-medium">Bygningsdetaljer</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="building_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type bygg</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FDV_BUILDING_TYPE_LABELS).map(([value, label]) => (
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
                  name="owner_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eierforhold</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FDV_OWNER_TYPE_LABELS).map(([value, label]) => (
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
                  name="area_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areal (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Antall etasjer</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usage_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bruk</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FDV_USAGE_TYPE_LABELS).map(([value, label]) => (
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aktiv">Aktiv</SelectItem>
                          <SelectItem value="inaktiv">Inaktiv</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contacts */}
            <div className="space-y-4">
              <h3 className="font-medium">Kontaktpersoner</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="internal_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intern kontakt</FormLabel>
                      <FormControl>
                        <Input placeholder="Navn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="internal_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+47" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="internal_contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-post</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="epost@firma.no" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="external_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ekstern kontakt (utleier/drift)</FormLabel>
                      <FormControl>
                        <Input placeholder="Navn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="external_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+47" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="external_contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-post</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="epost@firma.no" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notater</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Eventuelle merknader om bygget..."
                      className="min-h-[100px]"
                      {...field} 
                    />
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
                {building ? "Lagre endringer" : "Opprett bygg"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
