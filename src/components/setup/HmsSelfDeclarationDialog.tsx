import { SelfDeclarationDialog, type SelfDeclarationDialogProps } from "@/components/declarations/SelfDeclarationDialog";

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
        title: "Egenerklæring om HMS",
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
        signerHint: "Daglig leder eller den som setter opp systemet",
        successToast: "Egenerklæring om HMS er signert og lagret",
        completeText: "Egenerklæringen om HMS er nå lagret i systemet",
        allowSkip: true,
        logLabel: "HMS",
      }}
    />
  );
}
