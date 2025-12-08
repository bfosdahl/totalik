import { supabase } from "@/integrations/supabase/client";

// Generate example data for a complete demo project
export async function populateExampleProject(
  projectId: string,
  companyId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userName = "Demo Bruker";
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const daysAgo = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return formatDate(d);
    };
    const daysFromNow = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return formatDate(d);
    };

    // 1. Create Meetings (Møtereferater)
    const meetings = [
      {
        project_id: projectId,
        company_id: companyId,
        meeting_number: "MR-001",
        meeting_type: "byggmøte",
        meeting_date: daysAgo(14),
        location: "Byggeplass",
        participants: ["Ole Hansen (Byggeleder)", "Kari Olsen (Tømrer)", "Per Nilsen (Elektriker)"],
        status: "completed",
        notes: "God fremdrift. Alle på plan.",
      },
      {
        project_id: projectId,
        company_id: companyId,
        meeting_number: "MR-002",
        meeting_type: "hms_møte",
        meeting_date: daysAgo(7),
        location: "Brakke",
        participants: ["Ole Hansen (HMS-ansvarlig)", "Alle ansatte på byggeplass"],
        status: "completed",
        notes: "Gjennomgang av vernerunder og HMS-rutiner.",
      },
      {
        project_id: projectId,
        company_id: companyId,
        meeting_number: "MR-003",
        meeting_type: "byggemøte",
        meeting_date: daysFromNow(7),
        location: "Byggeplass",
        participants: ["Ole Hansen", "Kari Olsen"],
        status: "planned",
        notes: "",
      },
    ];

    const { data: createdMeetings, error: meetingsError } = await supabase
      .from("ks_module2_meetings" as any)
      .insert(meetings)
      .select() as any;
    
    if (meetingsError) console.error("Meetings error:", meetingsError);

    // Add meeting items for first meeting
    if (createdMeetings && createdMeetings[0]) {
      const firstMeetingId = createdMeetings[0].id as string;
      const meetingItems = [
        {
          meeting_id: firstMeetingId,
          item_type: "agenda",
          content: "Gjennomgang av fremdriftsplan",
          responsible_name: "Ole Hansen",
          status: "completed",
          sort_order: 1,
        },
        {
          meeting_id: firstMeetingId,
          item_type: "agenda",
          content: "Status underleverandører",
          responsible_name: "Kari Olsen",
          status: "completed",
          sort_order: 2,
        },
        {
          meeting_id: firstMeetingId,
          item_type: "action",
          content: "Bestille mer isolasjon",
          responsible_name: "Per Nilsen",
          deadline: daysFromNow(3),
          status: "pending",
          sort_order: 3,
        },
      ];
      await supabase.from("ks_module2_meeting_items" as any).insert(meetingItems);
    }

    // 2. Create Finances (Økonomi)
    const finances = {
      project_id: projectId,
      company_id: companyId,
      budget_total: 4500000,
      budget_labor: 1800000,
      budget_materials: 2200000,
      budget_subcontractors: 400000,
      budget_other: 100000,
      actual_labor: 720000,
      actual_materials: 950000,
      actual_subcontractors: 150000,
      actual_other: 35000,
    };
    await supabase.from("ks_module2_finances" as any).upsert(finances);

    // Cost entries
    const costEntries = [
      { project_id: projectId, company_id: companyId, category: "materials", description: "Trelast fra Byggmax", amount: 285000, date: daysAgo(21), supplier: "Byggmax AS" },
      { project_id: projectId, company_id: companyId, category: "materials", description: "Vinduer og dører", amount: 180000, date: daysAgo(14), supplier: "Nordan AS" },
      { project_id: projectId, company_id: companyId, category: "materials", description: "Isolasjon", amount: 95000, date: daysAgo(10), supplier: "Glava AS" },
      { project_id: projectId, company_id: companyId, category: "labor", description: "Tømrerarbeid uke 45", amount: 180000, date: daysAgo(14) },
      { project_id: projectId, company_id: companyId, category: "labor", description: "Tømrerarbeid uke 46", amount: 180000, date: daysAgo(7) },
      { project_id: projectId, company_id: companyId, category: "subcontractors", description: "Elektrikerarbeid", amount: 85000, date: daysAgo(5), supplier: "Elektro Partner AS" },
    ];
    await supabase.from("ks_module2_cost_entries" as any).insert(costEntries);

    // Invoices
    const invoices = [
      { project_id: projectId, company_id: companyId, invoice_number: "FAKT-001", description: "Akonto 1 - Grunnarbeid", amount: 450000, invoice_date: daysAgo(30), due_date: daysAgo(16), status: "paid", paid_date: daysAgo(18) },
      { project_id: projectId, company_id: companyId, invoice_number: "FAKT-002", description: "Akonto 2 - Råbygg", amount: 900000, invoice_date: daysAgo(14), due_date: daysFromNow(0), status: "sent" },
      { project_id: projectId, company_id: companyId, invoice_number: "FAKT-003", description: "Endringsarbeid - Ekstra vindu", amount: 45000, invoice_date: daysAgo(7), due_date: daysFromNow(7), status: "sent" },
    ];
    await supabase.from("ks_module2_invoices" as any).insert(invoices);

    // 3. Create Checklists (Egenkontroller)
    const checklists = [
      {
        project_id: projectId,
        company_id: companyId,
        title: "Betongstøp gulv - Kjeller",
        template_name: "Betongstøp gulv",
        responsible_user_name: "Ole Hansen",
        deadline_date: daysAgo(10),
        status: "completed",
        progress_percent: 100,
        completed_at: daysAgo(9) + "T14:30:00Z",
        is_paper_version: false,
        paper_uploaded: false,
        checklist_items: [
          { id: "1", text: "Forskaling kontrollert og godkjent", type: "yes_no", required: true, value: true },
          { id: "2", text: "Armering montert iht. tegning", type: "yes_no", required: true, value: true },
          { id: "3", text: "Betongkvalitet dokumentert", type: "yes_no", required: true, value: true },
          { id: "4", text: "Temperatur ved støp (°C)", type: "number", required: true, value: 12 },
          { id: "5", text: "Herdetid registrert", type: "yes_no", required: true, value: true },
        ],
        signatures: [{ type: "inspector", name: "Ole Hansen", date: daysAgo(9) }],
        created_by: userId,
      },
      {
        project_id: projectId,
        company_id: companyId,
        title: "Våtrom NS-3600 - Bad 1. etg",
        template_name: "Våtrom NS-3600",
        responsible_user_name: "Kari Olsen",
        deadline_date: daysFromNow(5),
        status: "in_progress",
        progress_percent: 60,
        is_paper_version: false,
        paper_uploaded: false,
        checklist_items: [
          { id: "1", text: "Underlag kontrollert – jevnt og tørt", type: "yes_no", required: true, value: true },
          { id: "2", text: "Fall mot sluk kontrollert (mm/m)", type: "number", required: true, value: 15 },
          { id: "3", text: "Membran påført iht. produsentens anvisning", type: "yes_no", required: true, value: true },
          { id: "4", text: "Tetthetsprøve utført", type: "yes_no", required: true, value: null },
          { id: "5", text: "Slukmansjett montert og tettet", type: "yes_no", required: true, value: null },
        ],
        signatures: [],
        created_by: userId,
      },
      {
        project_id: projectId,
        company_id: companyId,
        title: "Tømrer innvendig - Stue",
        template_name: "Tømrer – innvendig",
        responsible_user_name: "Per Nilsen",
        deadline_date: daysFromNow(14),
        status: "planned",
        progress_percent: 0,
        is_paper_version: false,
        paper_uploaded: false,
        checklist_items: [
          { id: "1", text: "Stenderverk montert iht. tegning", type: "yes_no", required: true, value: null },
          { id: "2", text: "Isolasjon lagt korrekt", type: "yes_no", required: true, value: null },
          { id: "3", text: "Dampsperre montert tett", type: "yes_no", required: true, value: null },
          { id: "4", text: "Gipsplater montert", type: "yes_no", required: true, value: null },
        ],
        signatures: [],
        created_by: userId,
      },
    ];
    await supabase.from("ks_module2_checklists" as any).insert(checklists);

    // 4. Create Avvik (Deviations)
    const avvik = [
      {
        project_id: projectId,
        company_id: companyId,
        avvik_number: "AVV-001",
        title: "Feil dimensjon på bjelkelag",
        description: "Bjelkelag i 2. etasje har feil dimensjon iht. tegning. Skal være 48x198, levert 48x148.",
        category: "kvalitet",
        severity: "high",
        status: "closed",
        location: "2. etasje, stue",
        discovered_date: daysAgo(12),
        deadline: daysAgo(5),
        responsible_name: "Ole Hansen",
        reported_by_name: userName,
        root_cause: "Feil i materialliste fra leverandør",
        corrective_action: "Nytt bjelkelag bestilt og montert",
        preventive_action: "Dobbeltsjekk materiallister ved mottak",
        closed_at: daysAgo(4) + "T10:00:00Z",
        closed_by_name: "Ole Hansen",
      },
      {
        project_id: projectId,
        company_id: companyId,
        avvik_number: "AVV-002",
        title: "Manglende branntetning",
        description: "Gjennomføring for ventilasjon i brannskille mangler tetning",
        category: "hms",
        severity: "medium",
        status: "in_progress",
        location: "Teknisk rom",
        discovered_date: daysAgo(3),
        deadline: daysFromNow(4),
        responsible_name: "Kari Olsen",
        reported_by_name: userName,
        corrective_action: "Branntetning bestilt, monteres denne uka",
      },
      {
        project_id: projectId,
        company_id: companyId,
        avvik_number: "AVV-003",
        title: "Riper i vindu",
        description: "Nytt vindu i soverom har riper på glasset",
        category: "kvalitet",
        severity: "low",
        status: "open",
        location: "Soverom 1",
        discovered_date: daysAgo(1),
        deadline: daysFromNow(10),
        responsible_name: "Per Nilsen",
        reported_by_name: userName,
      },
    ];
    await supabase.from("ks_module2_avvik" as any).insert(avvik);

    // 5. Create Subcontractors (Underleverandører)
    const subcontractors = [
      {
        project_id: projectId,
        company_id: companyId,
        company_name: "Elektro Partner AS",
        org_number: "912345678",
        contact_name: "Erik Strøm",
        contact_email: "erik@elektropartner.no",
        contact_phone: "99887766",
        work_scope: "Komplett elektrisk installasjon",
        contract_value: 450000,
        start_date: daysAgo(14),
        end_date: daysFromNow(21),
        status: "active",
        approval_status: "approved",
      },
      {
        project_id: projectId,
        company_id: companyId,
        company_name: "Rørlegger Olsen AS",
        org_number: "923456789",
        contact_name: "Lars Olsen",
        contact_email: "lars@rørleggerolsen.no",
        contact_phone: "98765432",
        work_scope: "VVS-installasjon",
        contract_value: 380000,
        start_date: daysFromNow(7),
        end_date: daysFromNow(35),
        status: "planned",
        approval_status: "pending",
      },
    ];
    await supabase.from("ks_module2_subcontractors" as any).insert(subcontractors);

    // 6. Create SJA
    const sjaList = [
      {
        project_id: projectId,
        company_id: companyId,
        sja_number: "SJA-001",
        title: "Arbeid i høyden - Taktekking",
        work_description: "Legging av takstein på skråtak, høyde 6-8 meter",
        location: "Tak",
        planned_date: daysAgo(7),
        responsible_name: "Ole Hansen",
        participants: ["Ole Hansen", "Kari Olsen", "Per Nilsen"],
        identified_risks: [
          { description: "Fall fra høyde", consequence: "Alvorlig personskade", probability: "medium" },
          { description: "Fallende gjenstander", consequence: "Personskade", probability: "low" },
        ],
        risk_reducing_measures: [
          { risk: "Fall fra høyde", measure: "Fallsikringsutstyr, stilas med rekkverk", responsible: "Ole Hansen" },
          { risk: "Fallende gjenstander", measure: "Avsperring av område under tak", responsible: "Kari Olsen" },
        ],
        overall_risk_level: "medium",
        status: "completed",
        completed_at: daysAgo(7) + "T08:00:00Z",
        completed_by_name: "Ole Hansen",
      },
      {
        project_id: projectId,
        company_id: companyId,
        sja_number: "SJA-002",
        title: "Varmt arbeid - Sveising",
        work_description: "Sveising av stålbjelker i bærekonstruksjon",
        location: "1. etasje",
        planned_date: daysFromNow(3),
        responsible_name: "Per Nilsen",
        participants: ["Per Nilsen"],
        identified_risks: [
          { description: "Brannfare", consequence: "Brann i bygget", probability: "medium" },
          { description: "Øyeskade fra lysbue", consequence: "Varig øyeskade", probability: "low" },
        ],
        risk_reducing_measures: [
          { risk: "Brannfare", measure: "Brannteppe, pulverapparat tilgjengelig, brannvakt", responsible: "Per Nilsen" },
          { risk: "Øyeskade", measure: "Sveisemaske og avskjerming", responsible: "Per Nilsen" },
        ],
        overall_risk_level: "medium",
        status: "draft",
      },
    ];
    await supabase.from("ks_module2_sja" as any).insert(sjaList);

    // 7. Create Vernerunder
    const vernerunder = [
      {
        project_id: projectId,
        company_id: companyId,
        vernerunde_number: "VR-001",
        title: "Ukentlig vernerunde uke 45",
        scheduled_date: daysAgo(14),
        completed_date: daysAgo(14),
        responsible_name: "Ole Hansen",
        participants: ["Ole Hansen", "Verneombud Kari"],
        status: "completed",
        findings: [
          { id: "f1", description: "Rotete rundt stilas - ryddes", location: "Fasade øst", severity: "low", status: "closed", responsible: "Per Nilsen", closedDate: daysAgo(12) },
        ],
        notes: "Generelt god orden på byggeplass",
        completed_by_name: "Ole Hansen",
        checklist_responses: [],
      },
      {
        project_id: projectId,
        company_id: companyId,
        vernerunde_number: "VR-002",
        title: "Ukentlig vernerunde uke 46",
        scheduled_date: daysAgo(7),
        completed_date: daysAgo(7),
        responsible_name: "Ole Hansen",
        participants: ["Ole Hansen", "Verneombud Kari"],
        status: "completed",
        findings: [
          { id: "f2", description: "Mangler skilting ved graveområde", location: "Tomt nord", severity: "medium", status: "open", responsible: "Ole Hansen", deadline: daysFromNow(2) },
        ],
        notes: "Påminnelse om bruk av hjelm i alle områder",
        completed_by_name: "Ole Hansen",
        checklist_responses: [],
      },
      {
        project_id: projectId,
        company_id: companyId,
        vernerunde_number: "VR-003",
        title: "Ukentlig vernerunde uke 47",
        scheduled_date: daysFromNow(0),
        responsible_name: "Ole Hansen",
        participants: [],
        status: "planned",
        findings: [],
        checklist_responses: [],
      },
    ];
    await supabase.from("ks_module2_vernerunder" as any).insert(vernerunder);

    // 8. Create Change Orders (Endringsmeldinger)
    const changeOrders = [
      {
        project_id: projectId,
        company_id: companyId,
        change_order_number: "EM-001",
        title: "Ekstra vindu i soverom",
        description: "Kunde ønsker ekstra vindu i soverom 2 for bedre lysforhold",
        reason: "Kundeønske",
        requested_by: "Ola Nordmann (Kunde)",
        requested_date: daysAgo(10),
        estimated_hours: 8,
        hourly_rate: 650,
        material_cost: 18000,
        total_cost: 23200,
        status: "approved",
        customer_approved: true,
        customer_approved_at: daysAgo(8) + "T12:00:00Z",
        customer_approved_by: "Ola Nordmann",
        internal_notes: "Vindu bestilt fra Nordan",
        attachments: [],
        created_by_name: userName,
      },
      {
        project_id: projectId,
        company_id: companyId,
        change_order_number: "EM-002",
        title: "Oppgradering gulvvarme til bad",
        description: "Kunde ønsker gulvvarme i begge bad i stedet for bare ett",
        reason: "Kundeønske",
        requested_by: "Ola Nordmann (Kunde)",
        requested_date: daysAgo(5),
        estimated_hours: 4,
        hourly_rate: 650,
        material_cost: 8500,
        total_cost: 11100,
        status: "pending",
        customer_approved: false,
        attachments: [],
        created_by_name: userName,
      },
    ];
    await supabase.from("ks_module2_change_orders" as any).insert(changeOrders);

    // 9. Create Claims (Reklamasjoner)
    const claims = [
      {
        project_id: projectId,
        company_id: companyId,
        claim_number: "REK-001",
        title: "Sprekk i fliser på bad",
        description: "Kunde oppdaget sprekk i to fliser ved dusj. Sannsynlig årsak: slag under transport/montasje.",
        category: "materials",
        priority: "medium",
        status: "in_progress",
        reported_by: "Ola Nordmann",
        reported_date: daysAgo(5),
        deadline: daysFromNow(10),
        responsible_name: "Kari Olsen",
        resolution_notes: "Nye fliser bestilt, byttes neste uke",
        estimated_cost: 2500,
      },
    ];
    await supabase.from("ks_module2_claims" as any).insert(claims);

    // 10. Create Stoffkartotek (Chemical Inventory)
    const stoffkartotek = [
      {
        project_id: projectId,
        company_id: companyId,
        product_name: "Jotun Demidekk Ultimate",
        manufacturer: "Jotun AS",
        danger_classes: ["Brannfarlig væske"],
        location: "Malingslager, brakke",
        notes: "Utvendig maling",
        last_updated: daysAgo(14),
      },
      {
        project_id: projectId,
        company_id: companyId,
        product_name: "Mapei Keraflex Maxi",
        manufacturer: "Mapei",
        danger_classes: ["Irriterende"],
        location: "Flislager",
        notes: "Flislim for bad og kjøkken",
        last_updated: daysAgo(7),
      },
      {
        project_id: projectId,
        company_id: companyId,
        product_name: "Glava Stålullsisolasjon",
        manufacturer: "Glava AS",
        danger_classes: ["Irriterende for hud"],
        location: "Materialcontainer",
        notes: "Bruk hansker og maske",
        last_updated: daysAgo(10),
      },
    ];
    await supabase.from("ks_module2_stoffkartotek" as any).insert(stoffkartotek);

    // 11. Create Milestones
    const milestones = [
      { project_id: projectId, company_id: companyId, title: "Grunnarbeid ferdig", target_date: daysAgo(30), completed_date: daysAgo(28), status: "completed", description: "Fundament og grunnmur ferdigstilt" },
      { project_id: projectId, company_id: companyId, title: "Råbygg ferdig", target_date: daysAgo(7), completed_date: daysAgo(5), status: "completed", description: "Bæresystem, tak og yttervegger" },
      { project_id: projectId, company_id: companyId, title: "Tett bygg", target_date: daysFromNow(7), status: "in_progress", description: "Vinduer, dører, taktekking" },
      { project_id: projectId, company_id: companyId, title: "Innvendig ferdig", target_date: daysFromNow(35), status: "planned", description: "Alle innvendige arbeider" },
      { project_id: projectId, company_id: companyId, title: "Ferdigstillelse", target_date: daysFromNow(56), status: "planned", description: "Sluttkontroll og overlevering" },
    ];
    await supabase.from("ks_module2_milestones" as any).insert(milestones);

    // Update project progress
    await supabase
      .from("ks_module2_projects" as any)
      .update({ 
        progress_percent: 45,
        description: "Dette er et fullstendig eksempelprosjekt med alle moduler utfylt: møtereferater, økonomi, sjekklister, avvik, underleverandører, SJA, vernerunder, endringsmeldinger, reklamasjoner og stoffkartotek. Bruk dette som referanse for hvordan systemet kan brukes.",
      })
      .eq("id", projectId);

    return { success: true };
  } catch (error) {
    console.error("Error populating example project:", error);
    return { success: false, error: String(error) };
  }
}
