

## Årshjul – Mobiloptimalisering og enklere redigering

### Problemer i dag
1. **Redigeringsknapper skjult på mobil**: Både i `AarshjulEditDialog` og i aktivitetslistene brukes `group-hover:opacity-100` – dette fungerer ikke på touch-enheter, så knappene er usynlige på mobil.
2. **Ingen tydelig "Rediger"-knapp på mobil**: Pencil-knappen for å åpne edit-dialogen vises kun når en måned er valgt, og er liten.
3. **Layouten er grid-basert** (`grid-cols-1 lg:grid-cols-2`): På mobil vises hjulet + aktivitetslisten under hverandre, men man må scrolle for å se aktiviteter etter å ha trykket på en måned.
4. **Ingen direkte "legg til"-knapp synlig** uten å først velge en måned.

### Plan

**1. Fjern hover-avhengighet for knapper (AarshjulEditDialog + HmsAarshjul)**
- Erstatt `opacity-0 group-hover:opacity-100` med alltid synlige knapper (evt. `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` for å beholde hover-effekt på desktop men alltid vise på mobil).
- Gjelder standard-aktiviteter, egne aktiviteter, og aktivitetslisten i hovedvisningen.

**2. Legg til "Rediger måned"-knapp under hjulet på mobil**
- Når en måned er valgt på mobil, vis en tydelig knapp under hjulet: "Rediger [Måned]" som åpner edit-dialogen.
- Flytt pencil-ikonet til en mer synlig plassering med tekst.

**3. Forbedre aktivitetslisten på mobil**
- Erstatt den lille `EyeOff`-knappen i aktivitetsrader med en swipe-lignende tydelig knapp, eller vis alltid.
- Legg til en flytende "+" knapp nederst for å raskt legge til ny aktivitet i valgt måned.

**4. Forbedre AarshjulEditDialog for mobil**
- Gjør dialogen fullskjerm på mobil (`sm:max-w-lg`).
- Vis knappene (Rediger/Slett) alltid synlige, ikke bare på hover.
- Legg til en tydelig "Legg til egen aktivitet"-knapp med `Plus`-ikon øverst.

### Filer som endres
- `src/components/audits/HmsAarshjul.tsx` – Mobilsynlighet for redigeringsknapper, bedre layout for valgt måned.
- `src/components/audits/AarshjulEditDialog.tsx` – Alltid synlige handlingsknapper, mobiloptimert dialog.

