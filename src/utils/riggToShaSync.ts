import { supabase } from "@/integrations/supabase/client";
import type { RiggCanvasData, RiggObject } from "@/hooks/useKsRiggPlan";
import type { RiskArea } from "@/hooks/useKsModule2ShaPlan";

/**
 * Markør som identifiserer auto-generert blokk i risikoområdets `measures`-felt.
 * Brukes til å erstatte tidligere riggplan-merknader ved re-sync uten å overskrive
 * tiltakene som er skrevet manuelt av brukeren.
 */
const RIGG_BLOCK_START = "[Riggplan – auto]";
const RIGG_BLOCK_END = "[/Riggplan]";

function stripRiggBlock(text: string | null | undefined): string {
  if (!text) return "";
  const re = new RegExp(
    `\\n*${escapeRe(RIGG_BLOCK_START)}[\\s\\S]*?${escapeRe(RIGG_BLOCK_END)}\\n*`,
    "g",
  );
  return text.replace(re, "").trimEnd();
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRiggBlock(lines: string[]): string {
  return `${RIGG_BLOCK_START}\n${lines.join("\n")}\n${RIGG_BLOCK_END}`;
}

interface ObjectRef {
  planName: string;
  object: RiggObject;
}

/**
 * Synkroniserer riggplan-objekter (kran, avfall, adkomst, rømning osv.) inn i SHA-planens
 * risikoområder. For hvert objekt med `linkedRiskParagraphs` markeres tilhørende risikoområde
 * som avkrysset, og en auto-merknad legges til i tiltaksfeltet.
 *
 * Returnerer antall risikoområder som ble oppdatert. Hvis det ikke finnes SHA-plan eller
 * det ikke er noen lenkede objekter, returneres 0 og ingen skrivinger gjøres.
 */
export async function syncRiggPlansToSha(projectId: string): Promise<number> {
  if (!projectId) return 0;

  // Hent gjeldende SHA-plan
  const { data: shaPlan, error: shaErr } = await supabase
    .from("ks_module2_sha_plans")
    .select("id, risk_areas")
    .eq("project_id", projectId)
    .eq("is_current_version", true)
    .maybeSingle();

  if (shaErr || !shaPlan) return 0;

  const riskAreas = ((shaPlan.risk_areas as unknown as RiskArea[]) || []).slice();
  if (riskAreas.length === 0) return 0;

  // Hent alle riggplaner for prosjektet
  const { data: plans, error: planErr } = await supabase
    .from("ks_module2_rigg_plans")
    .select("name, canvas_data")
    .eq("project_id", projectId);

  if (planErr) return 0;

  // Bygg map: paragraph -> [{ planName, object }]
  const byParagraph = new Map<string, ObjectRef[]>();
  for (const p of plans || []) {
    const canvas = (p.canvas_data as unknown as RiggCanvasData) || { objects: [] };
    for (const obj of canvas.objects || []) {
      const links = obj.linkedRiskParagraphs || [];
      for (const para of links) {
        if (!byParagraph.has(para)) byParagraph.set(para, []);
        byParagraph.get(para)!.push({ planName: p.name, object: obj });
      }
    }
  }

  // Oppdater hvert risikoområde
  let touched = 0;
  const updated = riskAreas.map((ra) => {
    const refs = byParagraph.get(ra.paragraph) || [];
    const cleanedMeasures = stripRiggBlock(ra.measures);

    if (refs.length === 0) {
      // Ingen lenkede objekter — bare fjern eventuell tidligere auto-blokk
      if (cleanedMeasures !== (ra.measures || "")) touched++;
      return { ...ra, measures: cleanedMeasures };
    }

    const lines = refs.map((r) => {
      const note = r.object.riskNote ? ` – ${r.object.riskNote}` : "";
      return `• ${r.object.label} (${r.planName})${note}`;
    });
    const block = buildRiggBlock(lines);
    const newMeasures = cleanedMeasures ? `${cleanedMeasures}\n\n${block}` : block;

    touched++;
    return { ...ra, checked: true, measures: newMeasures };
  });

  if (touched === 0) return 0;

  const { error: updErr } = await supabase
    .from("ks_module2_sha_plans")
    .update({ risk_areas: updated as any })
    .eq("id", shaPlan.id);

  if (updErr) {
    console.error("Failed to sync riggplan -> SHA:", updErr);
    return 0;
  }

  return updated.filter((ra) => (byParagraph.get(ra.paragraph) || []).length > 0).length;
}
