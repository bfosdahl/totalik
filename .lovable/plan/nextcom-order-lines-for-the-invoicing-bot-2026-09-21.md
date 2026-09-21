# Nextcom order lines for the invoicing bot

## What I found in the Nextcom API first

I probed the live Nextcom API with the existing connection (the same one order provisioning uses). Important limits:

- The only readable order endpoint is the paged order list. There is **no** per-order endpoint, and `/orders/{id}/lines` exists but rejects reading (`GET` unsupported) and rejects writing with our key ("you appear to be logged out" = it needs a browser session).
- Each order gives us: product names as one text string (`allProducts`), quantity of lines, total sum (`sumValue`), Kommentar (`comments`), status code (`statusId`), and a status message code.
- There is **no Notat field and no per-line price** in the API. Contacts and status lists return "not allowed" for our key.

So per-line prices must be derived, not fetched. The plan below does that safely and never blind-sums when BHT is present.

## Schema

**New table `nextcom_order_lines`** (one row per product line, order_id + line_no unique):
- `order_id`, `line_no`, `product_name`, `quantity`
- `unit_price`, `line_total`, `price_source` (`name` | `catalog` | `remainder` | `unknown`)
- `is_bht` (true for bedriftshelsetjeneste lines - bot skips these)
- `is_course`, `is_ik_module`, `needs_review`

**New table `nextcom_product_prices`** (learned price book):
- normalized product name -> price, sample count, last seen.
- Seeded and kept updated automatically from historical single-line orders, where the order total *is* the line price. This is what makes mixed orders solvable.

**New columns on `nextcom_processed_orders`** (existing columns untouched):
- `order_notat` (Notat text, written by admin/bot since the API does not expose it)
- `nextcom_status_id`, `nextcom_status_label` (e.g. blue "Bekreftet ikke sendt" vs sent), `nextcom_status_date`
- `invoice_state` + `invoiced_at` so the bot can mark an order invoiced on our side

## Price logic (per order)

1. Price written into the product name ("... - 1990,-") wins.
2. Otherwise look up the learned price book.
3. If exactly one line is still unknown, it gets `order total - known lines` (this recovers Leon: 20980 - 13990 BHT = 6990 IK).
4. If two or more remain unknown, they are left null and flagged `needs_review` - never split blindly.

## Sync changes

`process-nextcom-orders` gets a shared `orderLines.ts` helper: split `allProducts`, classify BHT/course/IK, resolve prices, write lines, refresh the price book, and store status + Kommentar on the order row. This runs for every order it touches, including skipped ones, so the bot sees everything.

Backfill: a `backfill_lines` mode re-reads the last ~1000 Nextcom orders and fills lines for existing rows.

## Bot access

New edge function `nextcom-order-api` (service key or system admin):
- `GET ?order_id=35899` -> order with Kommentar, Notat, status and its lines
- `POST` to set Notat, or mark `invoice_state = invoiced` after a Tripletex invoice

Marking an order green **inside Nextcom** is not possible with our current API key - that endpoint requires a browser session. I will document this and expose our own invoice state instead, so the bot is unblocked; getting a Nextcom API key with order-write scope would be the follow-up.

## Docs

Short section in README: table shapes, the "skip `is_bht`" rule, the `needs_review` flag, and an example query for order 35899 (IK 6990 + BHT 13990).
