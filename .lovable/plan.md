## Automatisk årlig HMS-revisjon

### Konsept
- **År 1 (håndbok-import):** Gratis. Systemet oppretter en revisjon automatisk basert på importert håndbok og setter `next_audit_due = import_date + 12 mnd`.
- **År 2+ (12 mnd etter):** Kunden får en pop-up ved innlogging + epost. To valg:
  1. **Gjør det selv – gratis** → går til revisjonsmodulen, fyller ut 8 punkter, signerer.
  2. **La Total-IK gjøre jobben – 990,-** → Stripe checkout → support-sak opprettes → Ben + Gard (+ evt. selger) får epost.

### Flyt

```text
12 mnd etter forrige revisjon
   │
   ├─ pg_cron daglig sjekk → audit_schedules.next_due <= today
   │     └─ opprett audit (status=pending) + send epost til kunde
   │
   ├─ Kunde logger inn → AnnualAuditDueDialog (blocker-modal)
   │     ├─ "Gjør det selv" → /audits/[id]
   │     └─ "Bestill bistand 990,-" → Stripe checkout
   │
   └─ Stripe webhook (paid)
         ├─ audit.assistance_status = 'paid'
         ├─ support_ticket opprettes (kategori: 'audit_assistance')
         └─ epost til ben@athenahms.no + gard + selger (BCC)
```

### Database

**Ny tabell `audit_schedules`:**
- `company_id`, `module` (default 'ik_hms'), `last_completed_at`, `next_due_at`, `reminder_sent_at`, `is_active`

**Utvidelser av `audits`:**
- `assistance_requested` (bool), `assistance_status` (`none|paid|in_progress|completed`), `stripe_session_id`, `paid_at`, `paid_amount_nok`
- `trigger_source` (`manual|handbook_import|annual_auto`)

**Selger-kobling (eksisterer):** `companies.seller_id` → `sellers` tabellen brukes allerede. Henter `sellers.email` for BCC.

### Komponenter

1. **pg_cron daglig** kl 08:00 → edge function `check-annual-audits`:
   - Finn skjemaer hvor `next_due_at <= today` og ingen aktiv pending audit
   - Opprett audit + send epost via `send-transactional-email` (ny template `annual-audit-due`)
   - Sett `reminder_sent_at`

2. **`AnnualAuditDueDialog`** (frontend):
   - Vises ved innlogging hvis det finnes audit med `status=pending` og `trigger_source=annual_auto`
   - Kan ikke lukkes uten å velge ett av to alternativer (eller "Påminn meg om 7 dager")

3. **Stripe checkout** (krever Lovable Payments – Stripe):
   - Engangsbeløp 990,- NOK
   - Webhook `stripe-audit-webhook` → markerer `paid`, oppretter support_ticket, sender epost

4. **Epost-templates (3 stk):**
   - `annual-audit-due` → til kunde (gratis vs bistand)
   - `audit-assistance-purchased` → til Ben (ben@athenahms.no) + Gard + selger
   - `audit-assistance-completed` → til kunde når Total-IK er ferdig

5. **Admin-dashboard** (`/admin/audit-orders`):
   - Liste over betalte bistandsbestillinger
   - Status: pending → in_progress → completed
   - Link rett til kundens revisjonsskjema for utfylling

6. **Håndbok-import oppdatering:**
   - Når AI importerer håndbok → opprett `audit_schedules` med `next_due_at = now() + 12 mnd`
   - Lagre faktiske svar i `audit_form_responses` (fikser dagens placeholder-problem fremover)

### Avklaringer før bygging

1. **Stripe:** Skal jeg sette opp Lovable's innebygde Stripe-integrasjon (990,- engangsbeløp, ingen Stripe-konto trengs nå – kan claimes senere)? Eller fakturering manuelt via eksisterende system (lettere, ingen webhook)?

2. **Selger-kobling:** Finnes `sellers.email` allerede med korrekte adresser, eller må jeg legge inn en mapping?

3. **Påminnelser:** Vil du ha varsel **30 dager før** forfall i tillegg til på selve dagen?

4. **Hvilke moduler:** Kun HMS nå, eller skal IK-Mat, IK-Alkohol, KS-Bygg også få 12-mnd auto-revisjon (samme pris/flyt)?