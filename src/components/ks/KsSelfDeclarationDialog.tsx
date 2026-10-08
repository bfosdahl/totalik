import { SelfDeclarationDialog, type SelfDeclarationDialogProps } from "@/components/declarations/SelfDeclarationDialog";
import { t } from "@/i18n/t";

export interface KsSelfDeclarationDialogProps extends SelfDeclarationDialogProps {}

export function KsSelfDeclarationDialog(props: KsSelfDeclarationDialogProps) {
  return (
    <SelfDeclarationDialog
      {...props}
      config={{
        table: "ks_self_declarations",
        companyLevelOnly: false,
        title: t("auto.egenerklaering_om_kvalitetssikringssyste"),
        infoDescription: "Bekreftelse på at bedriften har et velfungerende KS-system",
        declarationText: (
          <>
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="leading-relaxed">
                Det kreves at tilbyder har et godt og velfungerende kvalitetssikringssystem / styringssystem
                samt helse, miljø og sikkerhetspolicy for ytelsen som skal leveres. Tilbyder skal sørge for
                til enhver tid å ha et oppdatert kvalitetssikringssystem, samt sørge for at ansatte i egen
                organisasjon kjenner til og utfører sitt arbeid i henhold til dette.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="leading-relaxed">
                {t("auto.kvalitetssikringssystemet_skal_vaere_uta")}
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="leading-relaxed">
                {t("auto.tilbyder_skal_paa_anmodning_legge_fram_d")}
              </p>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="leading-relaxed font-medium">
                {t("auto.undertegnende_leverandoer_erklaerer_med_")}
              </p>
            </div>
          </>
        ),
        signerHint: t("auto.daglig_leder_eller_den_som_er_ansvarlig_"),
        successToast: t("auto.egenerklaering_om_kvalitetssikringssyste_2"),
        completeText: t("auto.egenerklaering_om_kvalitetssikringssyste"),
        allowSkip: false,
        logLabel: "KS",
      }}
    />
  );
}
