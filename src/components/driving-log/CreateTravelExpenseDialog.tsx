import React, { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, MapPin, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { DrivingLogEntry } from "@/hooks/useDrivingLog";
import { CreateTravelExpenseInput } from "@/hooks/useTravelExpenseReports";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DraftRestoreBanner } from "@/components/shared/DraftRestoreBanner";
import { t } from "@/i18n/t";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ExpenseItemInput {
  category: string;
  description: string;
  date: string;
  amount: number;
  receipt_file?: File;
}

const EXPENSE_CATEGORIES = [
  { value: "toll", label: t("auto.bom") },
  { value: "parking", label: t("auto.parkering") },
  { value: "fuel", label: t("auto.drivstoff") },
  { value: "public_transport", label: t("auto.kollektivtransport") },
  { value: "taxi", label: t("auto.taxi") },
  { value: "ferry", label: t("auto.ferge") },
  { value: "other", label: t("auto.annet") },
];

// Norwegian government rates (2024/2025)
const MILEAGE_RATES = [
  { value: "3.50", label: "3,50 kr/km (statens sats)" },
  { value: "4.00", label: t("auto.4_00_kr_km") },
  { value: "4.50", label: t("auto.4_50_kr_km") },
];

const DIET_RATES = [
  { value: "0", label: t("auto.ingen_diett") },
  { value: "315", label: "315 kr/dag (6-12 timer)" },
  { value: "556", label: "556 kr/dag (over 12 timer)" },
  { value: "849", label: "849 kr/dag (overnatting)" },
];

const ACCOMMODATION_RATES = [
  { value: "0", label: t("auto.ingen_overnatting") },
  { value: "435", label: "435 kr/natt (ulegitimert)" },
];

interface CreateTravelExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTravelExpenseInput) => void;
  isPending: boolean;
  completedTrips: DrivingLogEntry[];
}

export function CreateTravelExpenseDialog({
  open, onOpenChange, onSubmit, isPending, completedTrips,
}: CreateTravelExpenseDialogProps) {
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [returnDate, setReturnDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [departureLocation, setDepartureLocation] = useState("");
  const [mileageRate, setMileageRate] = useState("3.50");
  const [passengerSupplement, setPassengerSupplement] = useState("");
  const [dietRate, setDietRate] = useState("0");
  const [dietDays, setDietDays] = useState("");
  const [accommodationRate, setAccommodationRate] = useState("0");
  const [accommodationDays, setAccommodationDays] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [expenseItems, setExpenseItems] = useState<ExpenseItemInput[]>([]);

  const isDirty = !!(purpose || destination || departureLocation || notes || selectedTripIds.size > 0 || expenseItems.length > 0 || dietDays || accommodationDays || passengerSupplement);
  // Kvitteringsfiler kan ikke lagres i utkast – kun metadata
  const draftData = {
    purpose, destination, departureDate, returnDate, departureLocation,
    mileageRate, passengerSupplement, dietRate, dietDays,
    accommodationRate, accommodationDays, notes,
    selectedTripIds: Array.from(selectedTripIds),
    expenseItems: expenseItems.map(({ receipt_file, ...rest }) => rest),
  };
  const { draft, clear: clearDraft, dismiss: dismissDraft } = useFormDraft("reiseregning:ny", draftData, { enabled: open && isDirty });

  const restoreDraft = () => {
    if (!draft) return;
    const d = draft.data;
    setPurpose(d.purpose || "");
    setDestination(d.destination || "");
    setDepartureDate(d.departureDate || format(new Date(), "yyyy-MM-dd"));
    setReturnDate(d.returnDate || format(new Date(), "yyyy-MM-dd"));
    setDepartureLocation(d.departureLocation || "");
    setMileageRate(d.mileageRate || "3.50");
    setPassengerSupplement(d.passengerSupplement || "");
    setDietRate(d.dietRate || "0");
    setDietDays(d.dietDays || "");
    setAccommodationRate(d.accommodationRate || "0");
    setAccommodationDays(d.accommodationDays || "");
    setNotes(d.notes || "");
    setSelectedTripIds(new Set(d.selectedTripIds || []));
    setExpenseItems(d.expenseItems || []);
    dismissDraft();
  };


  // Calculate total km from selected trips
  const totalKm = useMemo(() => {
    return completedTrips
      .filter(t => selectedTripIds.has(t.id))
      .reduce((sum, t) => sum + Number(t.distance_km || 0), 0);
  }, [selectedTripIds, completedTrips]);

  const mileageAmount = totalKm * parseFloat(mileageRate);
  const dietAmount = parseInt(dietDays || "0") * parseFloat(dietRate);
  const accommodationAmount = parseInt(accommodationDays || "0") * parseFloat(accommodationRate);
  const otherExpensesTotal = expenseItems.reduce((sum, i) => sum + (i.amount || 0), 0);
  const grandTotal = mileageAmount + parseFloat(passengerSupplement || "0") + dietAmount + accommodationAmount + otherExpensesTotal;

  const toggleTrip = (id: string) => {
    setSelectedTripIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, {
      category: "toll",
      description: "",
      date: departureDate,
      amount: 0,
    }]);
  };

  const updateExpenseItem = (index: number, field: string, value: any) => {
    setExpenseItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-fill departure/destination from selected trips
    const selectedTrips = completedTrips.filter(t => selectedTripIds.has(t.id));
    const autoDepart = departureLocation || selectedTrips[0]?.start_location || "";
    const autoDest = destination || selectedTrips[selectedTrips.length - 1]?.end_location || "";

    onSubmit({
      purpose,
      destination: autoDest,
      departure_date: departureDate,
      return_date: returnDate,
      departure_location: autoDepart,
      total_km: totalKm,
      mileage_rate: parseFloat(mileageRate),
      passenger_supplement: parseFloat(passengerSupplement || "0"),
      diet_days: parseInt(dietDays || "0"),
      diet_rate: parseFloat(dietRate),
      accommodation_days: parseInt(accommodationDays || "0"),
      accommodation_rate: parseFloat(accommodationRate),
      linked_trip_ids: Array.from(selectedTripIds),
      notes: notes || undefined,
      items: expenseItems.map(item => ({
        ...item,
        amount: Number(item.amount),
      })),
    });
    clearDraft();
  };

  const resetForm = () => {
    setPurpose("");
    setDestination("");
    setDepartureDate(format(new Date(), "yyyy-MM-dd"));
    setReturnDate(format(new Date(), "yyyy-MM-dd"));
    setDepartureLocation("");
    setMileageRate("3.50");
    setPassengerSupplement("");
    setDietRate("0");
    setDietDays("");
    setAccommodationRate("0");
    setAccommodationDays("");
    setNotes("");
    setSelectedTripIds(new Set());
    setExpenseItems([]);
  };

  // Filter trips by date range
  const relevantTrips = completedTrips.filter(t => {
    if (!departureDate || !returnDate) return true;
    const tripDate = t.trip_date;
    return tripDate >= departureDate && tripDate <= returnDate;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("auto.ny_reiseregning")}</DialogTitle>
          <DialogDescription>
            {t("auto.opprett_reiseregning_basert_paa_turer_i_")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {draft && (
              <DraftRestoreBanner savedAt={draft.savedAt} onRestore={restoreDraft} onDiscard={clearDraft} />
            )}
            {/* Basic info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("auto.reisedetaljer")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">{t("auto.formaal_2")}</Label>
                  <Input id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder={t("auto.f_eks_kundemoete_i_bergen")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">{t("auto.reisemaal")}</Label>
                  <Input id="destination" value={destination} onChange={e => setDestination(e.target.value)} placeholder={t("auto.f_eks_bergen")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureLocation">{t("auto.avreisested")}</Label>
                  <Input id="departureLocation" value={departureLocation} onChange={e => setDepartureLocation(e.target.value)} placeholder={t("auto.f_eks_oslo")} />
                </div>
                <div className="space-y-2 sm:col-span-1" />
                <div className="space-y-2">
                  <Label htmlFor="departureDate">{t("auto.avreisedato")}</Label>
                  <Input id="departureDate" type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">{t("auto.returdato")}</Label>
                  <Input id="returnDate" type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} required />
                </div>
              </div>
            </div>

            <Separator />

            {/* Link trips from driving log */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("auto.koble_kjoereboksturer")}</h3>
              <p className="text-xs text-muted-foreground">{t("auto.velg_turer_fra_kjoereboken_for_aa_beregn")}</p>
              {relevantTrips.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {relevantTrips.map(trip => (
                    <label key={trip.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedTripIds.has(trip.id)}
                        onCheckedChange={() => toggleTrip(trip.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{format(parseISO(trip.trip_date), "dd.MM.yyyy")}</span>
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{trip.start_location} → {trip.end_location || "?"}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{trip.distance_km} km</Badge>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("auto.ingen_fullfoerte_turer_i_valgt_periode")}</p>
              )}
              {selectedTripIds.size > 0 && (
                <div className="text-sm font-medium">
                  Valgt: {selectedTripIds.size} turer = <span className="text-primary">{totalKm} km</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Mileage */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("auto.kjoeregodtgjoerelse")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("auto.total_km")}</Label>
                  <Input value={totalKm} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.sats_per_km")}</Label>
                  <Select value={mileageRate} onValueChange={setMileageRate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MILEAGE_RATES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.beloep")}</Label>
                  <Input value={`${mileageAmount.toFixed(2)} kr`} readOnly className="bg-muted font-medium" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passengerSupplement">Passasjertillegg (kr)</Label>
                <Input id="passengerSupplement" type="number" step="0.01" value={passengerSupplement} onChange={e => setPassengerSupplement(e.target.value)} placeholder="0" />
              </div>
            </div>

            <Separator />

            {/* Diet */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("auto.diett_kostgodtgjoerelse")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("auto.sats")}</Label>
                  <Select value={dietRate} onValueChange={setDietRate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIET_RATES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.antall_dager")}</Label>
                  <Input type="number" min="0" value={dietDays} onChange={e => setDietDays(e.target.value)} placeholder="0" disabled={dietRate === "0"} />
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.beloep")}</Label>
                  <Input value={`${dietAmount.toFixed(2)} kr`} readOnly className="bg-muted font-medium" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Accommodation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("auto.overnatting")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("auto.sats")}</Label>
                  <Select value={accommodationRate} onValueChange={setAccommodationRate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOMMODATION_RATES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.antall_netter")}</Label>
                  <Input type="number" min="0" value={accommodationDays} onChange={e => setAccommodationDays(e.target.value)} placeholder="0" disabled={accommodationRate === "0"} />
                </div>
                <div className="space-y-2">
                  <Label>{t("auto.beloep")}</Label>
                  <Input value={`${accommodationAmount.toFixed(2)} kr`} readOnly className="bg-muted font-medium" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Other expenses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{t("auto.andre_utlegg")}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addExpenseItem} className="gap-1">
                  <Plus className="w-3 h-3" /> {t("auto.legg_til_utlegg")}
                </Button>
              </div>
              {expenseItems.map((item, index) => (
                <div key={index} className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Utlegg {index + 1}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeExpenseItem(index)} className="h-7 w-7">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("auto.kategori")}</Label>
                      <Select value={item.category} onValueChange={v => updateExpenseItem(index, "category", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("auto.beskrivelse")}</Label>
                      <Input className="h-8 text-xs" value={item.description} onChange={e => updateExpenseItem(index, "description", e.target.value)} placeholder={t("auto.beskrivelse")} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("auto.dato")}</Label>
                      <Input className="h-8 text-xs" type="date" value={item.date} onChange={e => updateExpenseItem(index, "date", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("auto.beloep_kr")}</Label>
                      <Input className="h-8 text-xs" type="number" step="0.01" value={item.amount || ""} onChange={e => updateExpenseItem(index, "amount", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("auto.kvittering")}</Label>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      className="h-8 text-xs"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) updateExpenseItem(index, "receipt_file", file);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("auto.merknad")}</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("auto.eventuelle_merknader")} rows={2} />
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide">{t("auto.oppsummering")}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Kjøregodtgjørelse ({totalKm} km × {mileageRate} kr)</span>
                  <span>{mileageAmount.toFixed(2)} kr</span>
                </div>
                {parseFloat(passengerSupplement || "0") > 0 && (
                  <div className="flex justify-between">
                    <span>{t("auto.passasjertillegg")}</span>
                    <span>{parseFloat(passengerSupplement).toFixed(2)} kr</span>
                  </div>
                )}
                {dietAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Diett ({dietDays} dager × {dietRate} kr)</span>
                    <span>{dietAmount.toFixed(2)} kr</span>
                  </div>
                )}
                {accommodationAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Overnatting ({accommodationDays} netter × {accommodationRate} kr)</span>
                    <span>{accommodationAmount.toFixed(2)} kr</span>
                  </div>
                )}
                {otherExpensesTotal > 0 && (
                  <div className="flex justify-between">
                    <span>{t("auto.andre_utlegg")}</span>
                    <span>{otherExpensesTotal.toFixed(2)} kr</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>{t("auto.totalt")}</span>
                  <span className="text-primary">{grandTotal.toFixed(2)} kr</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("auto.avbryt")}</Button>
              <Button type="submit" disabled={isPending || !purpose || !destination}>
                {isPending ? "Oppretter..." : "Opprett reiseregning"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
