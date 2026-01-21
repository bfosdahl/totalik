# QA-sjekkliste: AI-oppsett (HMS/MAT)

> **Bruk denne sjekklisten HVER gang vi gjør endringer i AI-oppsett flyten.**  
> Alle punkter må være ✅ før en fix regnes som ferdig.

---

## Før testing
- [ ] Tøm sessionStorage: `sessionStorage.clear()` i console
- [ ] Sørg for at du er innlogget med en testbruker

---

## Testflyt

### 1. Oppstart (Ren tilstand)
| # | Test | Forventet | Status |
|---|------|-----------|--------|
| 1.1 | Gå til `/ai-oppsett` | Velkomstmelding fra "HMS Proffen" vises | ⬜ |
| 1.2 | Ingen feil i console | Ingen røde feil, ingen "Minified React error" | ⬜ |
| 1.3 | Input-felt er aktivt | Kan skrive melding umiddelbart | ⬜ |

### 2. Samtale-persistens
| # | Test | Forventet | Status |
|---|------|-----------|--------|
| 2.1 | Svar på 2-3 spørsmål | Svarene lagres i chat | ⬜ |
| 2.2 | Bytt fane (ny tab), kom tilbake | Samtalen er bevart | ⬜ |
| 2.3 | Refresh siden (F5) | Samtalen er bevart | ⬜ |

### 3. Avbrudd-håndtering
| # | Test | Forventet | Status |
|---|------|-----------|--------|
| 3.1 | Start spørsmål, lukk browser midt i strømming | Ved gjenåpning: "Prøv igjen" knapp | ⬜ |
| 3.2 | Klikk "Prøv igjen" | Strømming fortsetter uten duplikater | ⬜ |

### 4. Fullføring
| # | Test | Forventet | Status |
|---|------|-----------|--------|
| 4.1 | Fullfør hele flyten til JSON genereres | Ingen looping av spørsmål | ⬜ |
| 4.2 | "Oppsett fullført" melding vises | Grønn suksess-alert | ⬜ |
| 4.3 | Kan navigere til "Se generert innhold" | Knappen fungerer | ⬜ |

### 5. Database-verifisering
| # | Test | Forventet | Status |
|---|------|-----------|--------|
| 5.1 | Sjekk `company_risk_assessments` | Data finnes for company_id | ⬜ |
| 5.2 | Sjekk `company_action_plans` | Data finnes for company_id | ⬜ |
| 5.3 | Sjekk `company_routines` | Data finnes, ingen duplikater | ⬜ |
| 5.4 | Sjekk `company_modules` (IK_HMS) | `setupCompletedAt` er satt | ⬜ |

### 6. Re-kjør oppsett
| # | Test | Forventet | Status |
|---|------|-----------|--------|
| 6.1 | Klikk "Kjør oppsett på nytt" | Bekreftelsesdialog vises | ⬜ |
| 6.2 | Bekreft og kjør på nytt | Nytt oppsett starter uten feil | ⬜ |
| 6.3 | Fullfør igjen | Gammel data overskrives rent (ingen duplikater) | ⬜ |

---

## Etter testing
- [ ] Alle punkter er ✅
- [ ] Ingen nye console-feil
- [ ] Commit-melding refererer til denne sjekklisten

---

## Kjente feilmønstre å se etter

| Symptom | Mulig årsak |
|---------|-------------|
| "Minified React error #185" | Uendelig re-render loop, sjekk useEffect dependencies |
| Chat looper samme spørsmål | `buildKnownFactsMessage` fungerer ikke, eller DB lagrer ikke |
| "Prøv igjen" dukker opp konstant | AbortController ikke resatt, eller nettverk-timeout |
| Duplikater i database | Mangler `onConflict` i upsert |
| Blank side | Feil i data-parsing, sjekk JSON.parse |

---

## Sist oppdatert
- **Dato**: 2025-01-21
- **Versjon**: 1.0
