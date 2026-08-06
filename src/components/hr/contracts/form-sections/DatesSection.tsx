import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, temporaryReasons, contractTypes } from "../ExtendedContractFormData";

interface DatesSectionProps {
  formData: ExtendedContractFormData;
  onChange: (updates: Partial<ExtendedContractFormData>) => void;
}

export function DatesSection({ formData, onChange }: DatesSectionProps) {
  const isPredefinedTemporary = ['temporary', 'project', 'internship'].includes(formData.contract_type);
  const isCustomType = !contractTypes.some((t) => t.value === formData.contract_type);
  const isTemporary = isPredefinedTemporary || isCustomType;
  const reasonValue = formData.temporary_reason || '';
  const isKnownReason = temporaryReasons.some((r) => r.value === reasonValue);
  const [manualFreeText, setManualFreeText] = useState(false);
  const isFreeText = manualFreeText || (!!reasonValue && !isKnownReason);
  const setFreeText = setManualFreeText;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">Oppstart og varighet</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">Startdato *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">
            Sluttdato {isTemporary ? '*' : '(kun midlertidig)'}
          </Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => onChange({ end_date: e.target.value || null })}
            required={isTemporary}
          />
        </div>
      </div>

      {isTemporary && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Label htmlFor="temporary_reason">Grunnlag for midlertidig ansettelse *</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => {
                setFreeText(!isFreeText);
                onChange({ temporary_reason: '' });
              }}
            >
              {isFreeText ? 'Velg fra liste' : 'Skriv fritekst'}
            </Button>
          </div>

          {isFreeText ? (
            <Textarea
              id="temporary_reason"
              value={formData.temporary_reason || ''}
              onChange={(e) => onChange({ temporary_reason: e.target.value })}
              placeholder="F.eks. Sesongarbeid i sommersesongen juni-august, eller annet særskilt grunnlag"
              rows={3}
            />
          ) : (
            <Select
              value={formData.temporary_reason || ''}
              onValueChange={(value) => onChange({ temporary_reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg grunnlag" />
              </SelectTrigger>
              <SelectContent>
                {temporaryReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            Jf. arbeidsmiljøloven § 14-6 e) - grunnlaget for midlertidig ansettelse. Du kan skrive fritekst hvis ingen av valgene passer.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="probation_period">Prøvetid</Label>
        <Select
          value={formData.probation_period_months?.toString() || '0'}
          onValueChange={(value) => onChange({ probation_period_months: parseInt(value) || null })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Ingen prøvetid</SelectItem>
            <SelectItem value="1">1 måned</SelectItem>
            <SelectItem value="2">2 måneder</SelectItem>
            <SelectItem value="3">3 måneder</SelectItem>
            <SelectItem value="6">6 måneder</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Maks 6 måneder. Ved midlertidig: maks halvparten av ansettelsestiden.
        </p>
      </div>
    </div>
  );
}
