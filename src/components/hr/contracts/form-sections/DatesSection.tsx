import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtendedContractFormData, temporaryReasons, contractTypes } from "../ExtendedContractFormData";
import { t } from "@/i18n/t";

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
      <h3 className="font-semibold text-base border-b pb-2">{t("auto.oppstart_og_varighet")}</h3>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_date">{t("auto.startdato_3")}</Label>
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
            <Label htmlFor="temporary_reason">{t("auto.grunnlag_for_midlertidig_ansettelse")}</Label>
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
              placeholder={t("auto.f_eks_sesongarbeid_i_sommersesongen_juni")}
              rows={3}
            />
          ) : (
            <Select
              value={formData.temporary_reason || ''}
              onValueChange={(value) => onChange({ temporary_reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("auto.velg_grunnlag")} />
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
        <Label htmlFor="probation_period">{t("auto.proevetid_2")}</Label>
        <Select
          value={formData.probation_period_months?.toString() || '0'}
          onValueChange={(value) => onChange({ probation_period_months: parseInt(value) || null })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("auto.ingen_proevetid")}</SelectItem>
            <SelectItem value="1">{t("auto.1_maaned")}</SelectItem>
            <SelectItem value="2">{t("auto.2_maaneder")}</SelectItem>
            <SelectItem value="3">{t("auto.3_maaneder")}</SelectItem>
            <SelectItem value="6">{t("auto.6_maaneder")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("auto.maks_6_maaneder_ved_midlertidig_maks_hal")}
        </p>
      </div>
    </div>
  );
}
