import { useEffect, useState } from "react";
import UserSelect from "@/components/audits/UserSelect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTRACT_FORMS,
  OrgRole,
  useKsProjectOrganization,
} from "@/hooks/useKsProjectOrganization";

interface Props {
  projectId: string;
  /** Hides the surrounding card chrome when embedded in an accordion */
  bare?: boolean;
}

export function ProjectOrganizationEditor({ projectId, bare = false }: Props) {
  const { roles, contractForm, isLoading, isSaving, save } = useKsProjectOrganization(projectId);
  const [draft, setDraft] = useState<OrgRole[]>(roles);
  const [draftForm, setDraftForm] = useState<string>(contractForm);

  useEffect(() => {
    setDraft(roles);
  }, [roles]);
  useEffect(() => {
    setDraftForm(contractForm);
  }, [contractForm]);

  const update = (index: number, field: keyof OrgRole, value: string) => {
    setDraft((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(roles) || draftForm !== contractForm;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const body = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="font-semibold">Entrepriseform</Label>
        <p className="text-sm text-muted-foreground">
          Angi hvilken entrepriseform som benyttes i prosjektet.
        </p>
        <Select value={draftForm || undefined} onValueChange={setDraftForm}>
          <SelectTrigger className="sm:w-72">
            <SelectValue placeholder="Velg entrepriseform" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_FORMS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {draft.map((role, index) => (
        <div key={role.key} className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 space-y-2">
              <Label className="font-semibold">{role.label}</Label>
              <Textarea
                rows={2}
                value={role.responsibilities}
                onChange={(e) => update(index, "responsibilities", e.target.value)}
                placeholder="Beskriv ansvar"
              />
            </div>
            <div className="sm:w-64 space-y-2">
              <div>
                <Label className="text-sm">Navn</Label>
                <UserSelect
                  placeholder="Velg person"
                  value={role.name}
                  onValueChange={(val) => update(index, "name", val)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Firma</Label>
                <Input
                  className="mt-1"
                  value={role.company}
                  onChange={(e) => update(index, "company", e.target.value)}
                  placeholder="Firma / selskap"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Button onClick={() => save(draft, draftForm)} disabled={!isDirty || isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Lagre organisering
        </Button>
        {isDirty && (
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(roles);
              setDraftForm(contractForm);
            }}
          >
            Avbryt
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Endringer lagres både i HMS-planen og SHA-planen for prosjektet.
      </p>
    </div>
  );

  if (bare) return body;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-500" />
          Organisering og ansvar
        </CardTitle>
        <CardDescription>
          Hvem er byggherre, koordinatorer, prosjekterende, entreprenører og hovedbedrift?
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

export default ProjectOrganizationEditor;
