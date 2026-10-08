import { SelfDeclarationDialog, type SelfDeclarationDialogProps } from "@/components/declarations/SelfDeclarationDialog";
import { t } from "@/i18n/t";

export interface HmsSelfDeclarationDialogProps extends SelfDeclarationDialogProps {}

export function HmsSelfDeclarationDialog(props: HmsSelfDeclarationDialogProps) {
  return (
    <SelfDeclarationDialog
      {...props}
      config={{
        table: "hms_self_declarations",
        companyLevelOnly: true,
        extraFields: {
          employee_rep_name: null,
          employee_rep_signature: null,
          employee_rep_signed_at: null,
        },
        title: t("auto.egenerklaering_om_hms"),
        infoDescription: "Bekreftelse på systematisk HMS-arbeid",
        declarationText: (
          <>
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="leading-relaxed">
                Det bekreftes med dette at denne virksomheten arbeider systematisk for å oppfylle kravene i helse-, miljø-
                og sikkerhetslovgivningen og ved det tilfredsstille kravene i forskrift om systematisk helse-, miljø- og
                sikkerhetsarbeid i virksomheten (Internkontrollforskriften) fastsatt ved kgl.res. av 6. desember 1996 nr.
                1127 i medhold av lov av 4. februar 1977 nr. 4 om arbeidervern og arbeidsmiljø m.v.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="leading-relaxed">
                Det bekreftes at virksomheten er lovlig organisert i henhold til gjeldende skatte- og arbeidsmiljøregelverk
                når det gjelder ansattes faglige og sosiale rettigheter. Det aksepteres at oppdragsgiver etter anmodning vil
                bli gitt rett til gjennomgåelse og verifikasjon av virksomhetens system for ivaretakelse
                av helse, miljø og sikkerhet.
              </p>
            </div>
          </>
        ),
        signerHint: t("auto.daglig_leder_eller_den_som_setter_opp_sy"),
        successToast: t("auto.egenerklaering_om_hms_er_signert_og_lagr"),
        completeText: t("auto.egenerklaering_om_hms_er_naa_lagret_i_sy"),
        allowSkip: true,
        logLabel: "HMS",
      }}
    />
  );
}
