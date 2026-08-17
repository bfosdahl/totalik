import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-run-token",
};

// One-off job token (function is deleted right after the run)
const RUN_TOKEN = "sep26-renewal-4b71ce9028af3d65";

const NEW_COMPANIES = [
  {
    "company_name": "Kvernes",
    "org_number": "927890402",
    "email": "jtk.kavak@gmail.com",
    "first_name": "Jan Tore",
    "last_name": "Kvernes",
    "phone": "41751177",
    "address": "C/o Jan Tore Kvernes,rabben 1",
    "postal_code": "9801",
    "city": "Vadsø",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "The Grill House As",
    "org_number": "915585582",
    "email": "jeevan@fonixpizza.no",
    "first_name": "Jeevasuthan",
    "last_name": "Suvendran",
    "phone": "97503636",
    "address": "Olaus Fjørtofts Vei 69",
    "postal_code": "0982",
    "city": "Oslo",
    "modules": [
      "IK_HMS",
      "IK_MAT"
    ]
  },
  {
    "company_name": "Maskinell Bydrift As",
    "org_number": "927533782",
    "email": "frode@maskinellbydrift.no",
    "first_name": "Frode",
    "last_name": "Olsen",
    "phone": "90874736",
    "address": "Kisavegen 28b",
    "postal_code": "2056",
    "city": "Algarheim",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "Ad Probygg As",
    "org_number": "925138118",
    "email": "adprobygg@gmail.com",
    "first_name": "Andrius",
    "last_name": "Drozd",
    "phone": "0",
    "address": "H0101,anton Bergs Veg 56a",
    "postal_code": "7099",
    "city": "Flatåsen",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "Hageservice & Anlegg As",
    "org_number": "934359321",
    "email": "mag-nyg@hotmail.com",
    "first_name": "Magnus",
    "last_name": "Nygård",
    "phone": "91680571",
    "address": "Jåttåveien 108",
    "postal_code": "4020",
    "city": "Stavanger",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "Startrenovere M.A.Ropuszynski",
    "org_number": "917225184",
    "email": "startrenovere@gmail.com",
    "first_name": "Michal G",
    "last_name": "Ropuszynski",
    "phone": "46422809",
    "address": "Urabakken 12c",
    "postal_code": "6017",
    "city": "Ålesund",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "K Forst As",
    "org_number": "929725301",
    "email": "henri.knackstedt@hotmail.com",
    "first_name": "Henri",
    "last_name": "Knackstedt",
    "phone": "41401575",
    "address": "O 1081",
    "postal_code": "2450",
    "city": "Rena",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "Melon As",
    "org_number": "923391843",
    "email": "melon.mb.as@gmail.com",
    "first_name": "Morteza",
    "last_name": "Iqbalzadeh",
    "phone": "91928182",
    "address": "Dronningens Gate 42",
    "postal_code": "7012",
    "city": "Trondheim",
    "modules": [
      "IK_HMS",
      "IK_MAT"
    ]
  },
  {
    "company_name": "Stig Thoresen As",
    "org_number": "934178440",
    "email": "thoresen_7@hotmail.com",
    "first_name": "Stig",
    "last_name": "Thoresen",
    "phone": "98442399",
    "address": "Grøtliveien 128",
    "postal_code": "1930",
    "city": "Aurskog",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "The Blue Taj As",
    "org_number": "934012607",
    "email": "angel.ghaley1@gmail.com",
    "first_name": "Nar Bahadur",
    "last_name": "Ghaley",
    "phone": "48184853",
    "address": "Kongens Gate 5a",
    "postal_code": "3717",
    "city": "Skien",
    "modules": [
      "IK_HMS",
      "IK_MAT"
    ]
  },
  {
    "company_name": "Nordre Aker Drift As",
    "org_number": "834135582",
    "email": "vaktmester.niklas@nadrift.no",
    "first_name": "Niklas Herrscher",
    "last_name": "Bjørkeng",
    "phone": "92025108",
    "address": "Glads Vei 66a",
    "postal_code": "0489",
    "city": "Oslo",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "BYGGMESTER TOMMY LUND AS",
    "org_number": "926132180",
    "email": "tommylund79@hotmail.no",
    "first_name": "Tommy",
    "last_name": "Lund",
    "phone": "47651433",
    "address": "Iddefjordsveien 161",
    "postal_code": "1765",
    "city": "Halden",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "Fallingleaf With",
    "org_number": "931938452",
    "email": "niklas.walther1@hotmail.com",
    "first_name": "Niklas Walther",
    "last_name": "With",
    "phone": "48222518",
    "address": "C/o Niklas With,vikebakkvegen 5",
    "postal_code": "6065",
    "city": "Ulsteinvik",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "Khan Cars",
    "org_number": "928039951",
    "email": "khantransport2022@gmail.com",
    "first_name": "Samreen Khalid",
    "last_name": "Hussain",
    "phone": "40494241",
    "address": "Skaugumveien 8",
    "postal_code": "3057",
    "city": "Solbergelva",
    "modules": [
      "IK_HMS"
    ]
  },
  {
    "company_name": "North Dudes Klüwer",
    "org_number": "932085569",
    "email": "fredrik.kluwer@gmail.com",
    "first_name": "Fredrik Jensen",
    "last_name": "Klüwer",
    "phone": "95731820",
    "address": "Åsenveien 1",
    "postal_code": "1443",
    "city": "Drøbak",
    "modules": [
      "IK_HMS"
    ]
  }
];

const RECIPIENTS: { email: string; firstName: string; companyName: string }[] = [
  {
    "email": "jtk.kavak@gmail.com",
    "firstName": "Jan Tore",
    "companyName": "Kvernes"
  },
  {
    "email": "pawelpiotrak85@gmail.com",
    "firstName": "Pawel",
    "companyName": "Renova Group As"
  },
  {
    "email": "jeevan@fonixpizza.no",
    "firstName": "Jeevasuthan",
    "companyName": "The Grill House As"
  },
  {
    "email": "otmantransportas@gmail.com",
    "firstName": "Otmanis",
    "companyName": "Otman Transport As"
  },
  {
    "email": "frode@maskinellbydrift.no",
    "firstName": "Frode",
    "companyName": "Maskinell Bydrift As"
  },
  {
    "email": "romakapusta667@gmail.com",
    "firstName": "Roman",
    "companyName": "Ars Group As"
  },
  {
    "email": "adprobygg@gmail.com",
    "firstName": "Andrius",
    "companyName": "Ad Probygg As"
  },
  {
    "email": "mag-nyg@hotmail.com",
    "firstName": "Magnus",
    "companyName": "Hageservice & Anlegg As"
  },
  {
    "email": "startrenovere@gmail.com",
    "firstName": "Michal G",
    "companyName": "Startrenovere M.A.Ropuszynski"
  },
  {
    "email": "ygcollective12@gmail.com",
    "firstName": "Hawa Ishaq Arabi",
    "companyName": "Gagas Modesty"
  },
  {
    "email": "post@vaktmester-kenneth.no",
    "firstName": "Kenneth Skattebo",
    "companyName": "Vaktmester kenneth"
  },
  {
    "email": "ruban.oslovedlikehold@gmail.com",
    "firstName": "Ruban",
    "companyName": "Oslo Vedlikehold Og Snekkerservice As"
  },
  {
    "email": "post@singhror.no",
    "firstName": "Jaspreet Singh",
    "companyName": "Singh Rør As"
  },
  {
    "email": "post@intre.no",
    "firstName": "Slawomir",
    "companyName": "In Tre As"
  },
  {
    "email": "reza.noori94@gmail.com",
    "firstName": "Reza",
    "companyName": "Bnl Rørlegger Bedrift As"
  },
  {
    "email": "henri.knackstedt@hotmail.com",
    "firstName": "Henri",
    "companyName": "K Forst As"
  },
  {
    "email": "katalina.antonia.gomez@gmail.com",
    "firstName": "Katalina Antonia",
    "companyName": "Nails By Gomez"
  },
  {
    "email": "hadeland-rorservice@hotmail.com",
    "firstName": "Qais Ata",
    "companyName": "Hadeland Rørservice As"
  },
  {
    "email": "bygg@teammathias.no",
    "firstName": "MacIej",
    "companyName": "Team Mathias As"
  },
  {
    "email": "havard@terradrift.no",
    "firstName": "Håvard",
    "companyName": "Terradrift As"
  },
  {
    "email": "post@khalifa.no",
    "firstName": "Ahmed Khaled",
    "companyName": "Khalifa Management"
  },
  {
    "email": "melon.mb.as@gmail.com",
    "firstName": "Morteza",
    "companyName": "Melon As"
  },
  {
    "email": "vidar@sundt.as",
    "firstName": "Vidar",
    "companyName": "M-Industri As"
  },
  {
    "email": "post@romerikefuging.no",
    "firstName": "Lars Marius",
    "companyName": "Romerike Fuging As"
  },
  {
    "email": "thoresen_7@hotmail.com",
    "firstName": "Stig",
    "companyName": "Stig Thoresen As"
  },
  {
    "email": "angel.ghaley1@gmail.com",
    "firstName": "Nar Bahadur",
    "companyName": "The Blue Taj As"
  },
  {
    "email": "vaktmester.niklas@nadrift.no",
    "firstName": "Niklas Herrscher",
    "companyName": "Nordre Aker Drift As"
  },
  {
    "email": "post@rogersolfilm.no",
    "firstName": "Roger",
    "companyName": "Kvitberget As"
  },
  {
    "email": "kontakt@optimalprestasjon.no",
    "firstName": "Dmitrij Aleksandrovitsj",
    "companyName": "Optimal Prestasjon As"
  },
  {
    "email": "sergei@norskbadstue.no",
    "firstName": "Sergei",
    "companyName": "Norskbadstue As"
  },
  {
    "email": "ludmilasarpane@gmail.com",
    "firstName": "Ludmila",
    "companyName": "Sarpane Sjarm Og Skjønnhet."
  },
  {
    "email": "lauravladar@gmail.com",
    "firstName": "Vladislavas",
    "companyName": "Vladas Byggservice As"
  },
  {
    "email": "solbergbensinogservice@hotmail.com",
    "firstName": "Sven Erik",
    "companyName": "Solberg Bensin Og Service As"
  },
  {
    "email": "post@svelapp.no",
    "firstName": "Geir Lappen",
    "companyName": "Svelapp As"
  },
  {
    "email": "tommylund79@hotmail.no",
    "firstName": "Tommy",
    "companyName": "BYGGMESTER TOMMY LUND AS"
  },
  {
    "email": "kvern@kvern.no",
    "firstName": "Kim-Fredrik",
    "companyName": "BYGG OG VEDLIKEHOLD AS"
  },
  {
    "email": "post@art-bygg.no",
    "firstName": "Arton",
    "companyName": "ART-BYGG OG ANLEGG AS"
  },
  {
    "email": "post@vikingventilasjon.no",
    "firstName": "Amar",
    "companyName": "Viking Ventilasjon As"
  },
  {
    "email": "niklas.walther1@hotmail.com",
    "firstName": "Niklas Walther",
    "companyName": "Fallingleaf With"
  },
  {
    "email": "zhenrulu2005@outlook.com",
    "firstName": "Zhenru",
    "companyName": "Famsushi Røa As"
  },
  {
    "email": "ibrahim.demirbilek@outlook.com",
    "firstName": "Ibrahim Halil",
    "companyName": "Aile Kafe As"
  },
  {
    "email": "khantransport2022@gmail.com",
    "firstName": "Samreen Khalid",
    "companyName": "Khan Cars"
  },
  {
    "email": "fredrik.kluwer@gmail.com",
    "firstName": "Fredrik Jensen",
    "companyName": "North Dudes Klüwer"
  },
  {
    "email": "opoienstallogsmabruk@gmail.com",
    "firstName": "Ingvald",
    "companyName": "Opøien Stall Og Småbruk As"
  },
  {
    "email": "oddroar@live.no",
    "firstName": "Odd",
    "companyName": "Beito Membran As"
  },
  {
    "email": "mathiasheggelund77@gmail.com",
    "firstName": "Mathias",
    "companyName": "Heggelund Service As"
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.headers.get("x-run-token") !== RUN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const syncKey = Deno.env.get("SYNC_API_KEY") ?? "";
  const client = createClient(supabaseUrl, anonKey);

  const created: unknown[] = [];
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const c of NEW_COMPANIES) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/create-company-from-crm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sync-api-key": syncKey,
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ ...c, password: "Abc_1234", is_renewal: false }),
      });
      created.push({ company: c.company_name, status: res.status, body: await res.text() });
    } catch (e) {
      created.push({ company: c.company_name, error: String(e) });
    }
  }

  const seen = new Set<string>();
  for (const r of RECIPIENTS) {
    const key = r.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const { error } = await client.functions.invoke("send-renewal-email", {
        headers: { "x-cron-secret": cronSecret },
        body: { email: r.email, firstName: r.firstName, companyName: r.companyName },
      });
      if (error) failed.push({ email: r.email, error: error.message });
      else sent.push(r.email);
    } catch (e) {
      failed.push({ email: r.email, error: String(e) });
    }
    await new Promise((res) => setTimeout(res, 600));
  }

  return new Response(JSON.stringify({ created, sent, failed }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
