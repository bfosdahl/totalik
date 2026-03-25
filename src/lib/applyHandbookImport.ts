/**
 * Apply parsed handbook data to a company's HMS system.
 * Imports goals, organization, risks, action plans, routines, and historical deviations.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ParsedHandbookData {
  firmanavn: string | null;
  organisasjonsnummer: string | null;
  kontaktperson: string | null;
  epost: string | null;
  telefon: string | null;
  bransje: string | null;
  hmsmal: string[];
  organisasjon: {
    dagligLeder: string | null;
    verneombud: string | null;
    andreRoller: Array<{ rolle: string; navn: string }>;
  } | null;
  farekilder: Array<{
    beskrivelse: string;
    konsekvens: number;
    sannsynlighet: number;
    eksisterendeTiltak: string;
    planlagteTiltak: string;
  }>;
  handlingsplan: Array<{
    risikobeskrivelse: string;
    tiltaksbeskrivelse: string;
    ansvarlig: string;
    frist: string | null;
    status: string;
    prioritet: string;
  }>;
  rutiner: Array<{
    tittel: string;
    kategori: string;
    formaal: string;
    ansvar: string;
    prosedyre: string;
    frekvens: string;
  }>;
  avvik: Array<{
    tittel: string;
    beskrivelse: string;
    kategori: string;
    prioritet: string;
    status: string;
    rapportertAv: string;
    ansvarlig: string;
    dato: string | null;
    lukketDato: string | null;
    korrigerendeTiltak: string;
    forebyggendeTiltak: string;
  }>;
  kursOgOpplaering: { harRutiner: boolean; beskrivelse: string | null } | null;
  avvikssystem: { harEgetSystem: boolean; beskrivelse: string | null } | null;
  tilleggsinformasjon: string | null;
}

export interface HandbookImportResult {
  success: boolean;
  error?: string;
  summary: {
    goals: number;
    risks: number;
    actions: number;
    routines: number;
    deviations: number;
  };
}

const validCategories = ['safety', 'equipment', 'environmental', 'procedure', 'other', 'hygiene', 'temperature', 'workmanship'];
const validPriorities = ['lav', 'medium', 'høy', 'kritisk'];
const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];

function sanitizeCategory(cat: string): string {
  if (validCategories.includes(cat)) return cat;
  return 'other';
}

function sanitizePriority(p: string): string {
  if (validPriorities.includes(p)) return p;
  return 'medium';
}

function sanitizeStatus(s: string): string {
  const normalized = s?.replace('_', '-')?.toLowerCase();
  if (validStatuses.includes(normalized)) return normalized;
  return 'open';
}

export async function applyHandbookImport(
  companyId: string,
  data: ParsedHandbookData
): Promise<HandbookImportResult> {
  const summary = { goals: 0, risks: 0, actions: 0, routines: 0, deviations: 0 };

  try {
    console.log('[Handbook-Import] Starting import for company:', companyId);

    // 1. Goals
    if (data.hmsmal?.length > 0) {
      const goalsToInsert = data.hmsmal.map((goal, i) => ({
        company_id: companyId,
        goal_text: goal,
        is_predefined: false,
        sort_order: i,
      }));
      // Delete existing goals first to avoid duplicates, then insert new ones
      await supabase.from("company_goals").delete().eq("company_id", companyId);
      const { error } = await supabase.from("company_goals").insert(goalsToInsert);
      if (error) console.error("[Handbook-Import] Goals error:", error);
      else summary.goals = goalsToInsert.length;
    }

    // 2. Organization
    if (data.organisasjon) {
      const org = data.organisasjon;
      let content = '<h3>Organisering og ansvar</h3>\n<ul>';
      if (org.dagligLeder) content += `\n<li><strong>Daglig leder:</strong> ${org.dagligLeder}</li>`;
      if (org.verneombud) content += `\n<li><strong>Verneombud:</strong> ${org.verneombud}</li>`;
      org.andreRoller?.forEach(r => {
        content += `\n<li><strong>${r.rolle}:</strong> ${r.navn}</li>`;
      });
      content += '\n</ul>';

      await supabase.from("company_organization").upsert({
        company_id: companyId,
        custom_content: content,
        is_custom: true,
      }, { onConflict: 'company_id' });
    }

    // 3. Risk assessments
    if (data.farekilder?.length > 0) {
      const nestedRisks = data.farekilder.map((fk) => ({
        id: crypto.randomUUID(),
        hazard_source: 'annet',
        hazard_source_custom: fk.beskrivelse,
        events: [{
          id: crypto.randomUUID(),
          description: fk.beskrivelse,
          consequence: Math.min(5, Math.max(1, fk.konsekvens || 2)),
          probability: Math.min(5, Math.max(1, fk.sannsynlighet || 2)),
          measures: fk.eksisterendeTiltak || '',
          planned_measures: fk.planlagteTiltak || '',
          responsible: '',
          deadline: '',
          status: 'planlagt' as const,
        }],
        created_at: new Date().toISOString(),
        created_by: 'Håndbok-import',
        is_predefined: false,
      }));

      const { error } = await supabase.from("company_risk_assessments").upsert({
        company_id: companyId,
        risks: JSON.parse(JSON.stringify(nestedRisks)),
      }, { onConflict: 'company_id' });
      if (error) console.error("[Handbook-Import] Risks error:", error);
      else summary.risks = nestedRisks.length;
    }

    // 4. Action plan
    if (data.handlingsplan?.length > 0) {
      const actions = data.handlingsplan.map((a) => ({
        id: crypto.randomUUID(),
        risk_id: null,
        risk_description: a.risikobeskrivelse || '',
        action_description: a.tiltaksbeskrivelse || '',
        responsible: a.ansvarlig || '',
        deadline: a.frist || '',
        status: a.status === 'fullført' ? 'fullført' : a.status === 'pågår' ? 'pågår' : 'ikke_startet',
        priority: sanitizePriority(a.prioritet),
        comments: '',
      }));

      const { error } = await supabase.from("company_action_plans").upsert({
        company_id: companyId,
        actions: JSON.parse(JSON.stringify(actions)),
      }, { onConflict: 'company_id' });
      if (error) console.error("[Handbook-Import] Actions error:", error);
      else summary.actions = actions.length;
    } else {
      // Insert empty action plan
      await supabase.from("company_action_plans").upsert({ company_id: companyId, actions: [] }, { onConflict: 'company_id' });
    }

    // 5. Routines
    if (data.rutiner?.length > 0) {
      const routines = data.rutiner.map((r) => ({
        id: crypto.randomUUID(),
        title: r.tittel,
        description: r.formaal || '',
        category: r.kategori || 'hms',
        content: `<p><strong>Ansvar:</strong> ${r.ansvar || 'Ikke spesifisert'}</p>\n<p><strong>Frekvens:</strong> ${r.frekvens || 'Ved behov'}</p>\n<p>${r.prosedyre || ''}</p>`,
      }));

      const { error } = await supabase.from("company_routines").insert({
        company_id: companyId,
        routines: JSON.parse(JSON.stringify(routines)),
      });
      if (error) console.error("[Handbook-Import] Routines error:", error);
      else summary.routines = routines.length;
    }

    // 6. Historical deviations (backdated!)
    if (data.avvik?.length > 0) {
      for (const avvik of data.avvik) {
        const createdAt = avvik.dato ? new Date(avvik.dato).toISOString() : new Date().toISOString();
        const dueDate = avvik.dato || new Date().toISOString().split('T')[0];

        const insertData: any = {
          company_id: companyId,
          title: avvik.tittel || 'Importert avvik',
          description: [
            avvik.beskrivelse,
            avvik.korrigerendeTiltak ? `\n\n**Korrigerende tiltak:** ${avvik.korrigerendeTiltak}` : '',
            avvik.forebyggendeTiltak ? `\n\n**Forebyggende tiltak:** ${avvik.forebyggendeTiltak}` : '',
          ].filter(Boolean).join(''),
          category: sanitizeCategory(avvik.kategori),
          priority: sanitizePriority(avvik.prioritet),
          status: sanitizeStatus(avvik.status),
          reporter_name: avvik.rapportertAv || 'Importert fra håndbok',
          assignee_name: avvik.ansvarlig || null,
          due_date: dueDate,
          type: 'hms',
          created_at: createdAt,
          immediate_actions: avvik.korrigerendeTiltak || null,
          preventive_measures: avvik.forebyggendeTiltak || null,
          additional_info: 'Importert fra gammel HMS-håndbok',
        };

        if (avvik.lukketDato && (avvik.status === 'closed' || avvik.status === 'resolved')) {
          insertData.updated_at = new Date(avvik.lukketDato).toISOString();
        }

        const { error } = await supabase.from("deviations").insert(insertData);
        if (error) {
          console.error("[Handbook-Import] Deviation insert error:", error, insertData);
        } else {
          summary.deviations++;
        }
      }
    }

    // 7. Mark setup as complete
    await supabase
      .from("company_modules")
      .update({
        settings: {
          setupComplete: true,
          setupSource: 'handbook-import',
          setupDate: new Date().toISOString(),
          importedBransje: data.bransje,
        }
      })
      .eq("company_id", companyId)
      .eq("module_type", "IK_HMS");

    console.log('[Handbook-Import] Import complete:', summary);
    return { success: true, summary };

  } catch (error) {
    console.error("[Handbook-Import] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ukjent feil",
      summary,
    };
  }
}
