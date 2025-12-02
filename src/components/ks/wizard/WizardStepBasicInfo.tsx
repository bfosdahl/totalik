import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WizardData } from "../ProjectWizard";

interface WizardStepBasicInfoProps {
  data: WizardData;
  updateData: (data: Partial<WizardData>) => void;
}

const tiltakstypeOptions = [
  "Nybygg",
  "Rehabilitering", 
  "Tilbygg",
  "Påbygg",
  "Våtromsoppussing",
  "Næringsbygg",
  "Annet"
];

const tiltaksomradeOptions = [
  "Boligbygg",
  "Næringsbygg",
  "Offentlig bygg",
  "Tekniske installasjoner",
  "Anlegg"
];

const prosjektFunksjonOptions = [
  "Enebolig",
  "Tomannsbolig",
  "Rekkehus",
  "Leilighetsbygg",
  "Kontor",
  "Butikk",
  "Lager",
  "Skole",
  "Barnehage",
  "Annet"
];

export function WizardStepBasicInfo({ data, updateData }: WizardStepBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Prosjektnavn *</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          placeholder="F.eks. Enebolig Kongsberg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Prosjektadresse</Label>
        <Input
          id="address"
          value={data.address || ""}
          onChange={(e) => updateData({ address: e.target.value })}
          placeholder="F.eks. Storgata 1, 3600 Kongsberg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tiltakstype">Tiltakstype / Byggetype</Label>
          <Select
            value={data.tiltakstype}
            onValueChange={(value) => updateData({ tiltakstype: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg tiltakstype" />
            </SelectTrigger>
            <SelectContent>
              {tiltakstypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tiltaksomrade">Tiltaksområde (SAK10)</Label>
          <Select
            value={data.tiltaksomrade}
            onValueChange={(value) => updateData({ tiltaksomrade: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg område" />
            </SelectTrigger>
            <SelectContent>
              {tiltaksomradeOptions.map((omrade) => (
                <SelectItem key={omrade} value={omrade}>
                  {omrade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prosjekt_funksjon">Prosjektets funksjon</Label>
        <Select
          value={data.prosjekt_funksjon}
          onValueChange={(value) => updateData({ prosjekt_funksjon: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg funksjon" />
          </SelectTrigger>
          <SelectContent>
            {prosjektFunksjonOptions.map((funksjon) => (
              <SelectItem key={funksjon} value={funksjon}>
                {funksjon}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hva_skal_bygges">Hva skal bygges?</Label>
        <Textarea
          id="hva_skal_bygges"
          value={data.hva_skal_bygges || ""}
          onChange={(e) => updateData({ hva_skal_bygges: e.target.value })}
          placeholder="Beskriv kort hva som skal bygges..."
          rows={3}
        />
      </div>

      <div className="border-t pt-4 mt-6">
        <h4 className="font-semibold mb-3">Byggherre</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Navn *</Label>
            <Input
              id="client_name"
              value={data.client_name || ""}
              onChange={(e) => updateData({ client_name: e.target.value })}
              placeholder="F.eks. Ola Nordmann"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="byggherre_org_nr">Org.nr</Label>
              <Input
                id="byggherre_org_nr"
                value={data.byggherre_org_nr || ""}
                onChange={(e) => updateData({ byggherre_org_nr: e.target.value })}
                placeholder="123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="byggherre_kontakt">Kontaktinfo</Label>
              <Input
                id="byggherre_kontakt"
                value={data.byggherre_kontakt || ""}
                onChange={(e) => updateData({ byggherre_kontakt: e.target.value })}
                placeholder="Telefon / E-post"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ansvarlig_soker_info">Ansvarlig søker (hvis aktuelt)</Label>
        <Input
          id="ansvarlig_soker_info"
          value={data.ansvarlig_soker_info || ""}
          onChange={(e) => updateData({ ansvarlig_soker_info: e.target.value })}
          placeholder="Navn og kontaktinfo"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Startdato *</Label>
          <Input
            id="start_date"
            type="date"
            value={data.start_date}
            onChange={(e) => updateData({ start_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Forventet sluttdato</Label>
          <Input
            id="end_date"
            type="date"
            value={data.end_date || ""}
            onChange={(e) => updateData({ end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tiltaksklasse">Tiltaksklasse</Label>
        <Select
          value={data.tiltaksklasse}
          onValueChange={(value) => updateData({ tiltaksklasse: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg tiltaksklasse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Tiltaksklasse 1</SelectItem>
            <SelectItem value="2">Tiltaksklasse 2</SelectItem>
            <SelectItem value="3">Tiltaksklasse 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
