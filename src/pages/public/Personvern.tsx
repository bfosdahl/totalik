import { PageSeo } from "@/components/seo/PageSeo";

const Personvern = () => (
  <main className="min-h-screen bg-background px-5 py-12">
    <PageSeo
      title="Personvernerklæring"
      description="Slik behandler Athena Kurs og Internkontroll AS personopplysninger for Total-IK og totalik.no."
      path="/personvern"
    />
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Personvernerklæring</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Behandlingsansvarlig</h2>
        <p className="text-muted-foreground">
          Athena Kurs og Internkontroll AS, org.nr 934606450, Grønland 1, 1767 Halden.
          Kontakt: post@athenahms.no.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Hvilke opplysninger vi samler inn</h2>
        <p className="text-muted-foreground">
          Når du aktiverer velkomstpakken lagrer vi organisasjonsnummer, bedriftsnavn,
          kontaktperson, e-postadresse og telefonnummer. Opplysningene brukes kun til å
          opprette og følge opp avtalen din.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Grunnlag og lagringstid</h2>
        <p className="text-muted-foreground">
          Behandlingen skjer for å oppfylle avtalen med deg. Opplysningene lagres så lenge
          kundeforholdet varer, og slettes senest 12 måneder etter avsluttet avtale med mindre
          bokføringsloven krever lengre lagring.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Informasjonskapsler</h2>
        <p className="text-muted-foreground">
          Vi bruker kun nødvendige informasjonskapsler for innlogging og sikkerhet. Vi bruker ikke
          informasjonskapsler til markedsføring eller sporing på tvers av nettsteder.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Dine rettigheter</h2>
        <p className="text-muted-foreground">
          Du kan be om innsyn, retting eller sletting av opplysningene dine ved å kontakte oss på
          post@athenahms.no. Du kan også klage til Datatilsynet.
        </p>
      </section>
    </div>
  </main>
);

export default Personvern;
