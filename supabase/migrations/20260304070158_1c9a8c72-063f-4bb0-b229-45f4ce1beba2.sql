UPDATE company_modules SET settings = jsonb_set(
  jsonb_set(
    COALESCE(settings::jsonb, '{}'::jsonb),
    '{setupAnswers}',
    '{
      "businessType": "butikk",
      "numberOfEmployees": 0,
      "coolers": [
        {"name": "Frukt-kjøleskap", "location": "Butikk"},
        {"name": "Grønnsaker-kjøleskap", "location": "Butikk"},
        {"name": "Drikke og meierivarer-kjøleskap", "location": "Butikk"},
        {"name": "Kjøleskap 4", "location": "Butikk"},
        {"name": "Kjølerom", "location": "Lager"}
      ],
      "freezers": [
        {"name": "Fryser 1", "location": "Butikk/Lager"},
        {"name": "Fryser 2", "location": "Butikk/Lager"},
        {"name": "Fryser 3", "location": "Butikk/Lager"},
        {"name": "Fryserom", "location": "Lager"}
      ],
      "hasCleanZone": false,
      "allergens": [],
      "specificProcesses": "Selger utenlandske varer som ikke er vanlige i Norge, f.eks. arabisk cola og andre importerte produkter. Krever ekstra oppmerksomhet på merking, allergener og sporbarhet for importerte matvarer."
    }'::jsonb
  ),
  '{adminNotes}',
  '"Utstyrsoversikt lagt inn av administrator: 4 kjøleskap (frukt, grønnsaker, drikke/meieri, 1 ekstra) + 1 kjølerom. 3 frysere + 1 fryserom. Butikken selger utenlandske/importerte varer (arabisk cola m.m.)."'::jsonb
)
WHERE company_id = '53f3be73-0fec-40d7-bc10-4c311ec55216' AND module_type = 'IK_MAT';