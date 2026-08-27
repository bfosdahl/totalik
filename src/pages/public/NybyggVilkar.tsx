import { PageSeo } from "@/components/seo/PageSeo";

const NybyggVilkar = () => (
  <main className="min-h-screen bg-background px-5 py-12">
    <PageSeo
      title="Vilkår for velkomstpakken"
      description="Fullstendige vilkår for gratis velkomstpakke med Total-IK og IK-BYGG for nyetablerte byggebedrifter."
      path="/nybygg/vilkar"
    />
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Vilkår for velkomstpakken</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Gratisperiode</h2>
        <p className="text-muted-foreground">
          Total-IK med IK-BYGG og tilhørende nettside er gratis i 6 måneder fra aktivering.
          Det kreves ingen betalingsinformasjon ved aktivering, og det faktureres ikke i
          gratisperioden.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Etter gratisperioden</h2>
        <p className="text-muted-foreground">
          Ønsker dere å fortsette, koster abonnementet kr 6 990,- per år (fritatt mva).
          Nettsiden er inkludert så lenge abonnementet løper. Ønsker dere kun å beholde
          nettsiden etter oppsigelse, koster den kr 2 990,-.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Oppsigelse</h2>
        <p className="text-muted-foreground">
          Dere må selv si opp abonnementet skriftlig til post@athenahms.no før gratisperioden
          utløper dersom dere ikke ønsker å fortsette. Uten oppsigelse løper abonnementet videre
          til ordinær pris.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Levering</h2>
        <p className="text-muted-foreground">
          Systemet settes opp og er klart innen 48 timer etter aktivering. Vi kontakter
          oppgitt kontaktperson for oppstart og opplæring.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Leverandør</h2>
        <p className="text-muted-foreground">
          Athena Kurs og Internkontroll AS, org.nr 934606450, Grønland 1, 1767 Halden.
          Kontakt: Viktor Ørnelund, +47 941 49 311, viktor@athenahms.no.
        </p>
      </section>
    </div>
  </main>
);

export default NybyggVilkar;
