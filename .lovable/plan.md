
## Prosjekttype-velger i KS Bygg

### Oversikt
Legge til valg av prosjekttype ved opprettelse av prosjekt. Sidebaren og tilgjengelige moduler tilpasses basert på valgt type.

### Prosjekttyper

**Standard prosjekt** (project_type = 'standard') – Alt som i dag:
- Dashboard, Kvalitetssikring, HMS/SHA, Byggesak, Prosjektstyring, Økonomi, Partnere, Dokumentasjon

**Små prosjekter** (project_type = 'small'):
- Prosjektinfo, Sjekklister, Bilder, Notater, Timer, Befaringer, Dokumenter, UE, Økonomi

**Mini prosjekt** (project_type = 'mini'):
- Sjekklister, Avvik, Dokumenter

### Endringer

1. **Database**: `project_type`-kolonnen finnes allerede i `ks_module2_projects`. Sette default til `'standard'` og oppdatere eksisterende null-verdier.

2. **NewProjectDialog.tsx**: Legge til et første steg der brukeren velger prosjekttype (tre kort med ikon og beskrivelse). Standard-mal-velger vises kun for "Standard prosjekt".

3. **Ks2ProjectSidebar.tsx**: Filtrere menygrupper basert på `project.project_type`. Sende `projectType` som ny prop.

4. **Ks2ProjectDetail.tsx**: Sende `project_type` til sidebar. For små/mini prosjekter – nye sider for Bilder, Notater, Befaringer.

5. **useKsModule2Projects.ts**: Inkludere `project_type` i interfacet og insert-logikken.

### Nye sider for Små prosjekter
- Bilder (bildeoppslasting/galleri)
- Notater (enkle tekstnotater)
- Befaringer (befaringsrapporter)

Disse kan starte som enkle placeholder-sider og bygges ut senere.
