import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Plus, X } from "lucide-react";
import { HazardStatement, SdsComponent, SdsExtra } from "@/lib/sdsFields";

/** Read-only view. Stacks instead of a wide table so 390 px does not overflow. */
export function SdsExtraView({ value }: { value: SdsExtra }) {
  const comps = value.cas_numbers.filter((c) => c.name || c.cas || c.ec || c.percentage);
  const hazards = value.hazard_statements.filter((h) => h.code || h.text);
  const pics = value.pictograms.filter(Boolean);
  const date = /^\d{4}-\d{2}-\d{2}/.test(value.revision_date)
    ? value.revision_date.slice(0, 10).split("-").reverse().join(".")
    : "";
  if (!comps.length && !hazards.length && !value.signal_word && !date && !value.emergency_phone && !pics.length) {
    return null;
  }
  return (
    <div className="space-y-3 min-w-0 break-words">
      {comps.length > 0 && (
        <div>
          <Label className="text-muted-foreground">Stoffblanding</Label>
          <ul className="mt-1 space-y-2">
            {comps.map((c, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{c.name || "Komponent"}</p>
                <p className="text-muted-foreground">
                  {[c.cas && `CAS ${c.cas}`, c.ec && `EC ${c.ec}`, c.percentage].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hazards.length > 0 && (
        <div>
          <Label className="text-muted-foreground">Faresetninger</Label>
          <ul className="mt-1 space-y-1 text-sm">
            {hazards.map((h, i) => (
              <li key={i}>{h.text ? `${h.code} ${h.text}` : h.code}</li>
            ))}
          </ul>
        </div>
      )}
      {value.signal_word && (
        <div>
          <Label className="text-muted-foreground">Varselord</Label>
          <p className="text-sm font-medium">{value.signal_word}</p>
        </div>
      )}
      {pics.length > 0 && (
        <div>
          <Label className="text-muted-foreground">Piktogrammer</Label>
          <p className="text-sm">{pics.join(", ")}</p>
        </div>
      )}
      {date && (
        <div>
          <Label className="text-muted-foreground">Revisjonsdato</Label>
          <p className="text-sm">{date}</p>
        </div>
      )}
      {value.emergency_phone && (
        <div>
          <Label className="text-muted-foreground">Nødtelefon</Label>
          <p className="text-sm break-all">{value.emergency_phone}</p>
        </div>
      )}
    </div>
  );
}

export function SdsExtraForm({ value, onChange }: { value: SdsExtra; onChange: (next: SdsExtra) => void }) {
  const setComp = (i: number, patch: Partial<SdsComponent>) => {
    const cas_numbers = value.cas_numbers.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange({ ...value, cas_numbers });
  };
  const setHazard = (i: number, patch: Partial<HazardStatement>) => {
    const hazard_statements = value.hazard_statements.map((h, idx) => (idx === i ? { ...h, ...patch } : h));
    onChange({ ...value, hazard_statements });
  };
  return (
    <div className="space-y-4 min-w-0">
      <div>
        <div className="flex items-center justify-between gap-2">
          <Label>Stoffblanding</Label>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2"
            onClick={() => onChange({ ...value, cas_numbers: [...value.cas_numbers, { name: "", cas: "", ec: "", percentage: "" }] })}>
            <Plus className="w-3 h-3 mr-1" /> Legg til
          </Button>
        </div>
        <div className="space-y-2 mt-1">
          {value.cas_numbers.map((c, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input value={c.name} placeholder="Navn" aria-label="Komponentnavn" onChange={(e) => setComp(i, { name: e.target.value })} />
              <div className="flex gap-2">
                <Input value={c.cas} placeholder="CAS" aria-label="CAS-nummer" className="font-mono" onChange={(e) => setComp(i, { cas: e.target.value })} />
                <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Fjern komponent"
                  onClick={() => onChange({ ...value, cas_numbers: value.cas_numbers.filter((_, idx) => idx !== i) })}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input value={c.ec} placeholder="EC" aria-label="EC-nummer" className="font-mono" onChange={(e) => setComp(i, { ec: e.target.value })} />
              <Input value={c.percentage} placeholder="Mengde" aria-label="Mengde" onChange={(e) => setComp(i, { percentage: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <Label>Faresetninger</Label>
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2"
            onClick={() => onChange({ ...value, hazard_statements: [...value.hazard_statements, { code: "", text: "" }] })}>
            <Plus className="w-3 h-3 mr-1" /> Legg til
          </Button>
        </div>
        <div className="space-y-2 mt-1">
          {value.hazard_statements.map((h, i) => (
            <div key={i} className="flex gap-2">
              <Input value={h.code} placeholder="H225" aria-label="Faresetningskode" className="w-24 shrink-0 font-mono" onChange={(e) => setHazard(i, { code: e.target.value })} />
              <Input value={h.text} placeholder="Tekst fra databladet" aria-label="Faresetningstekst" className="min-w-0" onChange={(e) => setHazard(i, { text: e.target.value })} />
              <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Fjern faresetning"
                onClick={() => onChange({ ...value, hazard_statements: value.hazard_statements.filter((_, idx) => idx !== i) })}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="min-w-0">
          <Label htmlFor="sds_signal">Varselord</Label>
          <Input id="sds_signal" value={value.signal_word} placeholder="Fare" onChange={(e) => onChange({ ...value, signal_word: e.target.value })} />
        </div>
        <div className="min-w-0">
          <Label htmlFor="sds_revision">Revisjonsdato</Label>
          <DateInput id="sds_revision" value={value.revision_date} onChange={(e) => onChange({ ...value, revision_date: e.target.value })} />
        </div>
      </div>
      <div className="min-w-0">
        <Label htmlFor="sds_emergency">Nødtelefon</Label>
        <Input id="sds_emergency" value={value.emergency_phone} className="min-w-0" onChange={(e) => onChange({ ...value, emergency_phone: e.target.value })} />
      </div>
      <div className="min-w-0">
        <Label htmlFor="sds_pictograms">Piktogrammer</Label>
        <Input id="sds_pictograms" value={value.pictograms.join(", ")} placeholder="GHS02, GHS07" className="min-w-0"
          onChange={(e) => onChange({ ...value, pictograms: e.target.value.split(",").map((p) => p.trim()) })} />
      </div>
    </div>
  );
}
