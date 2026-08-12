import { useState, useRef, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Check, Pen, RotateCcw, Download, AlertCircle, Clock } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useMyContract } from "@/hooks/useMyContract";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { generateContractPdf } from "@/components/hr/contracts/generateContractPdf";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/i18n/t";

const contractTypeLabels: Record<string, string> = {
  permanent: 'Fast ansettelse',
  temporary: 'Midlertidig ansettelse',
  project: 'Prosjektansettelse',
  probation: 'Prøvetidsavtale',
  apprentice: 'Lærlingkontrakt',
  internship: 'Praksisplass',
};

const salaryTypeLabels: Record<string, string> = {
  monthly: 'Månedslønn',
  hourly: 'Timelønn',
  annual: 'Årslønn',
};

export default function MyContract() {
  const { contract, isLoading, signAsEmployee } = useMyContract();
  const { company } = useAuth();
  const signatureRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const resizeCanvas = useCallback(() => {
    if (signatureRef.current && containerRef.current) {
      const canvas = signatureRef.current.getCanvas();
      const container = containerRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = container.offsetWidth * ratio;
      canvas.height = 150 * ratio;
      canvas.style.width = `${container.offsetWidth}px`;
      canvas.style.height = '150px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
    }
  }, []);

  useEffect(() => {
    if (contract && !contract.signed_by_employee) {
      setTimeout(resizeCanvas, 100);
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [contract, resizeCanvas]);

  const handleClear = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const handleSignatureEnd = () => {
    setHasSignature(!signatureRef.current?.isEmpty());
  };

  const handleSign = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current.toDataURL('image/png');
      signAsEmployee.mutate({ signature: signatureData });
    }
  };

  const handleDownload = () => {
    if (!contract || !company) return;
    
    const employerInfo = {
      name: company.name,
      orgNumber: company.org_number || undefined,
      address: company.address ? `${company.address}, ${company.postal_code || ''} ${company.city || ''}`.trim() : undefined,
    };
    
    generateContractPdf(contract, employerInfo);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!contract) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Min arbeidsavtale
              </CardTitle>
              <CardDescription>{t("auto.se_og_signer_din_arbeidsavtale")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">{t("auto.ingen_arbeidsavtale_funnet")}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t("auto.du_har_ingen_arbeidsavtale_registrert_i_")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const canDownload = contract.signed_by_employee && contract.signed_by_employer;
  const needsEmployerSignature = !contract.signed_by_employer;
  const needsEmployeeSignature = !contract.signed_by_employee;

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Min arbeidsavtale
              </CardTitle>
              <CardDescription>
                {contract.status === 'active' 
                  ? 'Din aktive arbeidsavtale' 
                  : 'Se gjennom og signer din arbeidsavtale'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                {contract.status === 'active' && 'Aktiv'}
                {contract.status === 'draft' && 'Utkast'}
                {contract.status === 'pending_signature' && 'Venter på signatur'}
              </Badge>
              {canDownload && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Last ned PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("auto.stillingsinformasjon")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.stilling")}</span>
                  <span className="font-medium">{contract.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.ansettelsestype")}</span>
                  <span className="font-medium">{contractTypeLabels[contract.contract_type] || contract.contract_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.stillingsprosent")}</span>
                  <span className="font-medium">{contract.employment_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.startdato_2")}</span>
                  <span className="font-medium">
                    {format(new Date(contract.start_date), 'd. MMMM yyyy', { locale: nb })}
                  </span>
                </div>
                {contract.end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("auto.sluttdato_2")}</span>
                    <span className="font-medium">
                      {format(new Date(contract.end_date), 'd. MMMM yyyy', { locale: nb })}
                    </span>
                  </div>
                )}
                {contract.probation_period_months && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("auto.proevetid")}</span>
                    <span className="font-medium">{contract.probation_period_months} måneder</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("auto.arbeidstid")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.timer_per_uke")}</span>
                  <span className="font-medium">{contract.working_hours_per_week} timer</span>
                </div>
                {contract.working_hours_per_day && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("auto.timer_per_dag")}</span>
                    <span className="font-medium">{contract.working_hours_per_day} timer</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.pauselengde")}</span>
                  <span className="font-medium">{contract.break_duration_minutes} minutter</span>
                </div>
                {contract.workplace_address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("auto.arbeidssted")}</span>
                    <span className="font-medium text-right max-w-[200px]">{contract.workplace_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("auto.loenn_og_godtgjoerelse")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {contract.salary_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("auto.loenn")}</span>
                    <span className="font-medium">
                      {contract.salary_amount.toLocaleString('nb-NO')} kr ({salaryTypeLabels[contract.salary_type] || contract.salary_type})
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.utbetalingsdag")}</span>
                  <span className="font-medium">{contract.payment_day}. hver måned</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.feriepenger")}</span>
                  <span className="font-medium">{contract.holiday_pay_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.feriedager")}</span>
                  <span className="font-medium">{contract.vacation_days} dager</span>
                </div>
              </CardContent>
            </Card>

            {/* Notice Period */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("auto.oppsigelse")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.din_oppsigelsestid")}</span>
                  <span className="font-medium">{contract.notice_period_employee_months} {contract.notice_period_employee_months === 1 ? 'måned' : 'måneder'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("auto.arbeidsgivers_oppsigelsestid")}</span>
                  <span className="font-medium">{contract.notice_period_employer_months} {contract.notice_period_employer_months === 1 ? 'måned' : 'måneder'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          {(contract.work_description || contract.pension_scheme || contract.has_collective_agreement) && (
            <>
              <Separator />
              <div className="space-y-4">
                {contract.work_description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">{t("auto.arbeidsbeskrivelse")}</h4>
                    <p className="text-sm text-muted-foreground">{contract.work_description}</p>
                  </div>
                )}
                {contract.pension_scheme && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">{t("auto.pensjonsordning")}</h4>
                    <p className="text-sm text-muted-foreground">{contract.pension_scheme}</p>
                  </div>
                )}
                {contract.has_collective_agreement && contract.collective_agreement_name && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">{t("auto.tariffavtale")}</h4>
                    <p className="text-sm text-muted-foreground">{contract.collective_agreement_name}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Signature Status */}
          <div>
            <h3 className="text-sm font-medium mb-3">{t("auto.signaturstatus")}</h3>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px] p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  {contract.signed_by_employer ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">{t("auto.arbeidsgiver")}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {contract.signed_by_employer ? 'Signert' : 'Venter på signatur'}
                </p>
              </div>
              <div className="flex-1 min-w-[200px] p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  {contract.signed_by_employee ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">Arbeidstaker (deg)</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {contract.signed_by_employee ? 'Signert' : 'Venter på din signatur'}
                </p>
              </div>
            </div>
          </div>

          {/* Employee Signature Pad */}
          {needsEmployeeSignature && (
            <>
              <Separator />
              <div className="space-y-4">
                {needsEmployerSignature && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{t("auto.arbeidsgiver_har_ikke_signert_ennaa")}</span>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                      {t("auto.du_kan_fortsatt_signere_avtalen_den_vil_")}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Pen className="w-4 h-4" />
                      Din signatur
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Nullstill
                    </Button>
                  </div>
                  <div
                    ref={containerRef}
                    className="border rounded-lg bg-white overflow-hidden"
                  >
                    <SignatureCanvas
                      ref={signatureRef}
                      penColor="black"
                      canvasProps={{
                        className: 'w-full cursor-crosshair',
                        style: { touchAction: 'none' }
                      }}
                      onEnd={handleSignatureEnd}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("auto.tegn_signaturen_din_i_feltet_over_ved_aa")}
                  </p>
                </div>

                <Button 
                  onClick={handleSign} 
                  disabled={!hasSignature || signAsEmployee.isPending}
                  className="w-full sm:w-auto"
                >
                  {signAsEmployee.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Check className="w-4 h-4 mr-2" />
                  Signer arbeidsavtale
                </Button>
              </div>
            </>
          )}

          {/* Already signed message */}
          {contract.signed_by_employee && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">{t("auto.du_har_signert_denne_avtalen")}</span>
              </div>
              {contract.signed_date && (
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  Signert {format(new Date(contract.signed_date), 'd. MMMM yyyy', { locale: nb })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
