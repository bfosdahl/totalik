// Delt hjelpefil: gjør NextCom-ordren om til strukturerte ordrelinjer som
// faktureringsroboten kan lese uten å logge inn i NextCom i nettleser.
//
// Bakgrunn: NextCom sitt offentlige API gir oss KUN produktnavnene som én
// tekststreng (allProducts) + ordresum (sumValue). Det finnes ingen endepunkt
// for linjepriser. Derfor utleder vi prisene slik, i prioritert rekkefølge:
//   1. "name"      – prisen står i produktnavnet ("... - 1990,-")
//   2. "single"    – ordren har kun én linje, da er ordresummen linjeprisen
//   3. "catalog"   – vi slår opp i prisboken (nextcom_product_prices), som
//                    læres automatisk av alle enlinjeordre
//   4. "remainder" – nøyaktig én ukjent linje igjen: ordresum minus kjente
//                    linjer (dette gir f.eks. IK 6990 på en IK+BHT-ordre)
// Er to eller flere linjer fortsatt ukjente, settes pris null og
// needs_review = true. Vi gjetter aldri ved å fordele summen blindt.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const NEXTCOM_STATUS_LABELS: Record<number, string> = {
  1: "Ikke bekreftet",
  2: "Bekreftet ikke sendt",
  10: "Bekreftet/sendt",
  25: "Fakturert",
  29: "Avsluttet kundeforhold",
  98: "Avsluttet",
  99: "Avsluttet",
};

const BHT_KEYWORDS = ["bedriftshelsetjeneste", "bedrifthelsetjeneste", "bht", "avonova"];
const COURSE_KEYWORDS = [
  "kurs", "course", "opplæring", "sertifisering", "varme arbeider", "varmearbeider",
  "arbeid i høyden", "truck", "stillas", "fallsikring", "førstehjelp",
  "brannvern", "hms-kort", "adr", "maskinførerbevis",
];
const IK_KEYWORDS = [
  "ik/hms", "ik hms", "ik-hms", "hms system", "internkontroll", "ik/mat", "ik mat",
  "mattrygghet", "ks bygg", "ik bygg", "ik/khms", "kvalitetssystem", "gdpr",
  "personalhåndbok", "personalhandbok", "åpenhetsloven", "apenhetsloven",
  "fdv", "total-ik", "totalik", "byggepakke", "velkomstpakke",
];

export interface ParsedLine {
  line_no: number;
  product_name: string;
  quantity: number;
  unit_price: number | null;
  line_total: number | null;
  price_source: "name" | "catalog" | "remainder" | "single" | "unknown";
  is_bht: boolean;
  is_course: boolean;
  is_ik_module: boolean;
  needs_review: boolean;
}

function has(name: string, words: string[]): boolean {
  const lower = name.toLowerCase();
  return words.some((w) => lower.includes(w));
}

/** Fjerner nullbytes/kontrolltegn som Postgres avviser i tekstfelt. */
export function cleanText(value: string | null | undefined): string | null {
  if (value == null) return null;
  // deno-lint-ignore no-control-regex
  const cleaned = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();
  return cleaned || null;
}

export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\u00a0]+/g, " ")
    .replace(/[.,;:]+$/g, "")
    .trim();
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Plukker ut pris skrevet inn i produktnavnet, f.eks. "HMS kurs - 1 990,-". */
function priceFromName(name: string): number | null {
  // "gratis"/"kr 0" betyr null kroner – viktig for å ikke feiltolke restbeløp
  if (/\bgratis\b|\bfree\b|\bkostnadsfri/i.test(name)) return 0;
  const m = name.match(/(\d[\d\s.\u00a0]*)(?:,-|,00|\s*kr\b)/i);
  if (!m) return null;
  const value = Number(m[1].replace(/[\s.\u00a0]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Deler allProducts-strengen i enkeltlinjer med antall ("2 x Kurs"). */
export function splitProducts(allProducts: string | null | undefined): Array<{ name: string; quantity: number }> {
  const source = cleanText(allProducts);
  if (!source) return [];
  return source
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((raw) => {
      const qm = raw.match(/^(\d+)\s*[x×]\s*(.+)$/i);
      if (qm) return { name: qm[2].trim(), quantity: Number(qm[1]) };
      return { name: raw, quantity: 1 };
    });
}

export function parseOrderLines(
  allProducts: string | null | undefined,
  orderSum: number | null | undefined,
  priceBook: Map<string, number>,
): ParsedLine[] {
  const raw = splitProducts(allProducts);
  if (raw.length === 0) return [];

  const lines: ParsedLine[] = raw.map((r, i) => ({
    line_no: i + 1,
    product_name: r.name,
    quantity: r.quantity,
    unit_price: null,
    line_total: null,
    price_source: "unknown",
    is_bht: has(r.name, BHT_KEYWORDS),
    is_course: has(r.name, COURSE_KEYWORDS) && !has(r.name, IK_KEYWORDS),
    is_ik_module: has(r.name, IK_KEYWORDS),
    needs_review: false,
  }));

  // 1) pris i navnet
  for (const line of lines) {
    const p = priceFromName(line.product_name);
    if (p !== null) {
      line.unit_price = p;
      line.price_source = "name";
    }
  }

  const sum = typeof orderSum === "number" && orderSum > 0 ? orderSum : null;

  // 2) enlinjeordre: ordresummen ER linjeprisen
  if (lines.length === 1 && sum !== null && lines[0].price_source === "unknown") {
    lines[0].unit_price = round2(lines[0].quantity > 0 ? sum / lines[0].quantity : sum);
    lines[0].price_source = "single";
  }


  const applyCatalog = (only?: (l: ParsedLine) => boolean) => {
    for (const line of lines) {
      if (line.price_source !== "unknown") continue;
      if (only && !only(line)) continue;
      const known = priceBook.get(normalizeProductName(line.product_name));
      if (known !== undefined) {
        line.unit_price = known;
        line.price_source = "catalog";
      }
    }
  };

  const applyRemainder = () => {
    const unknown = lines.filter((l) => l.price_source === "unknown");
    if (unknown.length !== 1 || sum === null) return;
    const knownTotal = lines
      .filter((l) => l.price_source !== "unknown")
      .reduce((acc, l) => acc + (l.unit_price ?? 0) * l.quantity, 0);
    const rest = Math.round((sum - knownTotal) * 100) / 100;
    if (rest <= 0) return;
    const l = unknown[0];
    l.unit_price = l.quantity > 0 ? Math.round((rest / l.quantity) * 100) / 100 : rest;
    l.price_source = "remainder";
  };

  // 3) prisbok for BHT/kurs først – de prisene er faste og pålitelige,
  //    mens IK-lisenser varierer med lisenslengde og rabatt.
  applyCatalog((l) => l.is_bht || l.is_course);
  // 4) rest: kun hvis nøyaktig én linje er ukjent
  applyRemainder();
  // 5) prisbok for resten, deretter ev. en ny restberegning
  applyCatalog();
  applyRemainder();


  const usedCatalog = lines.some((l) => l.price_source === "catalog");
  const usedRemainder = lines.some((l) => l.price_source === "remainder");
  for (const line of lines) {
    line.line_total = line.unit_price === null
      ? null
      : Math.round(line.unit_price * line.quantity * 100) / 100;
    // Restberegning som bygger på katalogpriser kan bomme hvis katalogprisen
    // gjelder en annen lisenslengde – hele fordelingen flagges da for kontroll.
    line.needs_review = line.unit_price === null || (usedCatalog && usedRemainder);
  }


  // Sikkerhetsnett: summen av linjene må stemme med ordresummen, ellers er
  // prisene usikre og hele ordren må kontrolleres manuelt.
  if (sum !== null && lines.every((l) => l.line_total !== null)) {
    const total = lines.reduce((acc, l) => acc + (l.line_total ?? 0), 0);
    if (Math.abs(total - sum) > 1) for (const l of lines) l.needs_review = true;
  }



  return lines;
}

/** Leser prisboken inn i minnet (brukes for oppslag på flerlinjeordre). */
export async function loadPriceBook(supabase: SupabaseClient): Promise<Map<string, number>> {
  const book = new Map<string, number>();
  const { data, error } = await supabase
    .from("nextcom_product_prices")
    .select("normalized_name, unit_price");
  if (error) {
    console.error("[NextCom lines] Kunne ikke lese prisbok:", error.message);
    return book;
  }
  for (const row of data || []) book.set(row.normalized_name, Number(row.unit_price));
  return book;
}

/** Lærer pris fra enlinjeordre, slik at flerlinjeordre kan løses senere. */
export async function learnPrices(
  supabase: SupabaseClient,
  orderId: string,
  lines: ParsedLine[],
  priceBook: Map<string, number>,
): Promise<void> {
  const teachable = lines.filter(
    (l) => (l.price_source === "single" || l.price_source === "name") && l.unit_price !== null,
  );
  if (teachable.length === 0) return;

  for (const line of teachable) {
    const key = normalizeProductName(line.product_name);
    const { error } = await supabase.from("nextcom_product_prices").upsert({
      normalized_name: key,
      product_name: line.product_name,
      unit_price: line.unit_price,
      is_bht: line.is_bht,
      last_seen_order_id: orderId,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "normalized_name" });
    if (error) {
      console.error(`[NextCom lines] Prisbok-oppdatering feilet for "${key}":`, error.message);
    } else {
      priceBook.set(key, line.unit_price!);
    }
  }
}

export interface OrderLineSource {
  id: string | number;
  allProducts?: string | null;
  sumValue?: number | null;
  statusId?: number | null;
  statusMessage?: string | null;
  statusDate?: string | null;
}

/** Skriver ordrelinjer + status for én ordre. Feiler aldri hele synken. */
export async function syncOrderLines(
  supabase: SupabaseClient,
  order: OrderLineSource,
  priceBook: Map<string, number>,
): Promise<ParsedLine[]> {
  const orderId = String(order.id);
  try {
    const lines = parseOrderLines(order.allProducts, order.sumValue, priceBook);
    await learnPrices(supabase, orderId, lines, priceBook);

    if (lines.length > 0) {
      const { error } = await supabase.from("nextcom_order_lines").upsert(
        lines.map((l) => ({ order_id: orderId, ...l })),
        { onConflict: "order_id,line_no" },
      );
      if (error) console.error(`[NextCom lines] Lagring feilet for ordre ${orderId}:`, error.message);

      // Fjern gamle linjer hvis ordren har blitt kortere
      await supabase
        .from("nextcom_order_lines")
        .delete()
        .eq("order_id", orderId)
        .gt("line_no", lines.length);
    }
    return lines;
  } catch (e) {
    console.error(`[NextCom lines] Uventet feil for ordre ${orderId}:`, e);
    return [];
  }
}

/** Statusfelter som lagres på nextcom_processed_orders. */
export function statusFacts(order: OrderLineSource) {
  const sid = typeof order.statusId === "number" ? order.statusId : null;
  const raw = (order.statusMessage || "").trim();
  const readable = raw && !/^fWebText\(/i.test(raw) ? raw : null;
  return {
    nextcom_status_id: sid,
    nextcom_status_label: (sid !== null ? NEXTCOM_STATUS_LABELS[sid] : null) ?? readable,
    nextcom_status_date: order.statusDate || null,
    lines_synced_at: new Date().toISOString(),
  };
}
