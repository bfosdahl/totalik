# NextCom-ordrelinjer for faktureringsroboten

Formål: roboten skal kunne fakturere uten å logge inn i NextCom i nettleser.

## Bakgrunn: hva NextCom-API-et faktisk gir

Det eneste leselige endepunktet er den paginerte ordrelisten
(`/crm-system/orders?offset=..&limit=..&locale=nor`). Den gir **ikke** linjepriser,
og det finnes **ikke** noe Notat-felt i API-et. `POST /orders/{id}/lines` krever
nettlesersesjon (401 med API-nøkkelen vår). Derfor utledes linjeprisene hos oss,
og Notat lagres manuelt via vårt eget API.

## Tabeller

### `nextcom_processed_orders` (utvidet, bakoverkompatibel)
| Felt | Betydning |
| --- | --- |
| `order_comments` | Kommentar fra NextCom |
| `order_notat` | Notat – settes av oss (finnes ikke i API-et) |
| `nextcom_status_id` / `nextcom_status_label` / `nextcom_status_date` | 1 = Ikke bekreftet, **2 = Bekreftet ikke sendt (blå)**, 10 = Bekreftet/sendt (grønn), 25 = Fakturert, 29/98/99 = Avsluttet |
| `invoice_state` | `pending` / `skip` / `invoiced` / `hold` – vår fakturastatus |
| `invoiced_at`, `lines_synced_at` | tidsstempler |

### `nextcom_order_lines`
`order_id`, `line_no`, `product_name`, `quantity`, `unit_price`, `line_total`,
`price_source`, `is_bht`, `is_course`, `is_ik_module`, `needs_review`.

`price_source` forteller hvor prisen kommer fra:
- `name` – pris står i produktnavnet («… 1 990,-»); «gratis» gir 0
- `single` – enlinjeordre, ordresummen er linjeprisen
- `catalog` – prisbok (`nextcom_product_prices`, vanligste observerte pris)
- `remainder` – ordresum minus de kjente linjene, kun når **nøyaktig én** linje er ukjent
- `unknown` – pris ikke funnet

Vi fordeler aldri en ordresum blindt. Er to eller flere linjer ukjente, blir
prisen `null` og `needs_review = true`.

## Regler roboten må følge

1. Fakturer kun linjer der `is_bht = false` (BHT faktureres av BHT-leverandøren).
2. Hopp over ordren hvis noen linje har `needs_review = true` – da er
   prisfordelingen usikker og må kontrolleres manuelt.
3. Blå ordre klare for fakturering: `nextcom_status_id = 2` og
   `invoice_state = 'pending'`.
4. Sett `invoice_state = 'invoiced'` etter at fakturaen er laget i Tripletex.
   NextCom kan ikke settes grønt via API – vår `invoice_state` er fasiten.

## API: `nextcom-order-api`

Autentisering: header `x-sync-api-key: <SYNC_API_KEY>` eller JWT for system_admin.

```bash
# Én ordre med linjer
curl "$URL/functions/v1/nextcom-order-api?order_id=35921" -H "x-sync-api-key: $KEY"

# Blå ordre som venter på faktura
curl "$URL/functions/v1/nextcom-order-api?status_id=2&invoice_state=pending&limit=50" \
  -H "x-sync-api-key: $KEY"

# Lagre notat / marker som fakturert
curl -X POST "$URL/functions/v1/nextcom-order-api" -H "x-sync-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"order_id":"35921","notat":"Hold – venter på kunde","invoice_state":"hold"}'
```

Svaret inneholder `billable_total` (sum av ikke-BHT-linjer) og `needs_review`.

## Synk

- Vanlig kjøring av `process-nextcom-orders` skriver linjer + status for hver
  ordre den behandler.
- Etterfylling av historikk:
  `POST /functions/v1/process-nextcom-orders` med `x-cron-secret` og
  `{"backfill_lines": true, "pages": 12}` (12 sider = ca. 1 200 nyeste ordre).

## Eksempel: blandet IK + BHT (ordre 35921, sum 10 980,01)

| line_no | product_name | unit_price | price_source | is_bht |
| --- | --- | --- | --- | --- |
| 1 | Ut periode hos tidligere leverandør gratis | 0 | name | false |
| 2 | Bedriftshelsetjeneste 1-4 ansatte 12mnd avtale ink. kartlegging | 3 990 | catalog | true |
| 3 | Internkontroll-Kvalitetssystem (IK/KHMS) 24 mnd lisens … | 6 990,01 | remainder | false |

Roboten fakturerer da 6 990,01 (linje 3) og hopper over BHT-linjen.
