import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KsHmsOrganizationStepProps {
  organization: any;
  onSave: (content: any) => Promise<void>;
}

const exampleOrganization = `
PROSJEKTORGANISERING:

Prosjektleder: [Navn]
- Ansvar: Overordnet ansvar for prosjektet, HMS-koordinering, økonomistyring

Byggeleder: [Navn]
- Ansvar: Daglig drift på byggeplass, kvalitetssikring, fremdriftsoppfølging

HMS-ansvarlig: [Navn]
- Ansvar: HMS-oppfølging, risikovurderinger, SJA, rapportering av avvik

Verneombud: [Navn]
- Ansvar: Ivareta arbeidstakernes interesser i HMS-spørsmål

Formenn/Lagledere:
- Tømrerleder: [Navn]
- Betongarbeider: [Navn]

Underleverandører:
- Elektro: [Firmanavn]
- VVS: [Firmanavn]
- Malermester: [Firmanavn]
`;

export function KsHmsOrganizationStep({ organization, onSave }: KsHmsOrganizationStepProps) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (organization?.text) {
      setContent(organization.text);
    } else if (!content) {
      setContent(exampleOrganization);
    }
  }, [organization]);

  const handleSave = async () => {
    await onSave({ text: content });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prosjektorganisering og roller</CardTitle>
          <CardDescription>
            Beskriv prosjektets organisasjonsstruktur, nøkkelroller og ansvarsområder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Organisasjonsstruktur</Label>
            <Textarea
              id="organization"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Beskriv prosjektorganiseringen..."
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Lagre organisering og gå videre
      </Button>
    </div>
  );
}