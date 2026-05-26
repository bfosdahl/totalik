## Fire ting fra Eiriks siste e-poster

### 1. Auto-lagring av rutiner under opprettelse
**Problem:** Eirik glemmer å trykke "Lagre" og mister arbeidet.
**Løsning:** Auto-lagre i dialogen for ny/redigert rutine hvert 2. sekund etter siste tastetrykk (debounced). Bruker eksisterende `is_draft`-mønster der det finnes, ellers lagrer som vanlig rutine men med en `draft=true`-markør i UI til brukeren trykker "Ferdig". Viser liten "Lagret xx:xx" indikator.
**Filer:** `AiRoutineDialog.tsx`, evt. `RoutineEditDialog.tsx` — finn den eksisterende rutine-dialogen i `IkHmsRutiner.tsx`.

### 2. SJA: «alt i én boks»-modus + PDF som faktisk virker
**Problem:** Når Eirik skriver én stor risiko i én rad i stedet for mange små, blir PDF-en uleselig (se bildene — bare tekstvegg uten struktur).
**Løsning:**
- Behold dagens «punkt for punkt»-flyt som standard.
- Legg til en bryter øverst i SJA-wizarden: "Enkel modus (alt i én boks)" som kollapser hele SJA-en til ett risikoområde + ett tiltak.
- PDF-en (`generateSjaPdf` eller tilsvarende) får ny gren som rendrer enkel-modus med flytende tekst, automatisk linjebrytning, og side-skift basert på `html2canvas`-section-strategi (capture per logisk seksjon, ikke fast slicing) — som forhindrer det rotete kuttet på bildene.
- Strukturert modus får samme `html2canvas`-fix slik at lange tekster ikke kuttes.

### 3. Dagsrapport-PDF med mange bilder
**Problem:** BB-Lifter prosjektets dagsrapport med 40 bilder timer ut når PDF genereres.
**Løsning:**
- Last bilder parallelt med `Promise.all` + komprimer hvert bilde til maks 1600 px / JPEG 0.8 *før* `jsPDF`-innsetting (kraftig reduksjon i minnebruk og tid).
- Lazy-batch: prosessér 5 bilder om gangen for å unngå memory spike.
- Vis fremdriftsindikator ("Behandler bilde 12 av 40…") slik at det ikke virker hengt.
- Sett `useCORS: true, scale: 1.5` på `html2canvas`-kallene.
- **Multi-logo:** legg til ny seksjon i prosjekt-innstillinger der man kan laste opp én ekstra "partner-logo" + tekstetikett. Begge logoer (SSM + partner) vises side ved side i topptekst på dagsrapporten.
**Filer:** `DailyReportPDF.tsx`/`generateDailyReportPdf.ts`, prosjekt-innstillinger.

### 4. Kjørebok: bilpark
**Problem:** Må skrive registreringsnummer manuelt hver gang.
**Løsning:**
- Ny tabell `company_vehicles` (id, company_id, license_plate, make, model, year, default_for_user_id nullable, is_active, deleted_at).
- RLS: company-members kan lese, admins kan endre.
- Ny side under HR/Kjørebok-innstillinger: "Bilpark" — liste, legg til/rediger/slett.
- Kjørebok-skjemaet får dropdown "Velg bil" først, med "Skriv inn manuelt" som fallback. Når en bil velges, fylles `license_plate`, `vehicle_make`, `vehicle_model` automatisk.
- Migrering: legg til `vehicle_id uuid nullable` på `driving_log_entries`.

---

## Gjennomføringsrekkefølge

1. **Migrasjon** for `company_vehicles` + `vehicle_id` på `driving_log_entries`.
2. **Auto-lagring** (raskest, mest verdifullt for Eirik akkurat nå).
3. **Dagsrapport-PDF** (kritisk — han starter prosjekt neste uke).
4. **SJA enkel-modus + PDF-fix**.
5. **Bilpark UI** (vehicle-side + dropdown i kjørebok).

---

## Risiko & merknader

- PDF-fiksene må testes mot BB-Lifter-rapporten — vi kan hente bilde-antallet fra DB for å bekrefte 40 bilder.
- Auto-lagring må ikke overskrive ferdiglagrede rutiner — bruker `draft`-flagg.
- Bilpark er en ny tabell; ingen eksisterende data trenger migrering.

Vil du jeg setter i gang?
