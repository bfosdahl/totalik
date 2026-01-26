-- Create table for HMS vernerunde templates
CREATE TABLE IF NOT EXISTS public.hms_vernerunde_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hms_vernerunde_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view system templates and company templates" 
ON public.hms_vernerunde_templates 
FOR SELECT 
USING (is_system_template = true OR company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Company admins can create templates" 
ON public.hms_vernerunde_templates 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Company admins can update their templates" 
ON public.hms_vernerunde_templates 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Company admins can delete their templates" 
ON public.hms_vernerunde_templates 
FOR DELETE 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
) AND is_system_template = false);

-- Insert system templates based on the uploaded documents
INSERT INTO public.hms_vernerunde_templates (template_name, description, checkpoints, is_system_template, is_active) VALUES
(
  'Standard vernerunde',
  'Systematisk gjennomgang av arbeidsmiljøet - dekker de viktigste områdene',
  '[
    {"id": "1", "category": "Orden og renhold", "checkpoint": "Gangveier og fluktveier er frie for hindringer", "help_text": "Sjekk at alle gangveier og nødutganger er ryddige"},
    {"id": "2", "category": "Orden og renhold", "checkpoint": "Lokaler er ryddige og godt vedlikeholdt", "help_text": null},
    {"id": "3", "category": "Orden og renhold", "checkpoint": "Avfall håndteres og sorteres på egnet sted", "help_text": null},
    {"id": "4", "category": "Orden og renhold", "checkpoint": "Søl (væske, olje, kjemikalier) fjernes raskt", "help_text": null},
    {"id": "5", "category": "Orden og renhold", "checkpoint": "Lagring skjer på egnede plasser og i riktig høyde/stabling", "help_text": null},
    {"id": "6", "category": "Fysiske forhold", "checkpoint": "Belysning er tilstrekkelig og fungerer", "help_text": null},
    {"id": "7", "category": "Fysiske forhold", "checkpoint": "Støynivå vurderes som akseptabelt", "help_text": null},
    {"id": "8", "category": "Fysiske forhold", "checkpoint": "Temperatur og luftkvalitet oppleves som tilfredsstillende", "help_text": null},
    {"id": "9", "category": "Fysiske forhold", "checkpoint": "Gulv og trapper er hele og uten snublefare", "help_text": null},
    {"id": "10", "category": "Fysiske forhold", "checkpoint": "Skilt og merking (nødutganger, påbudsskilt) er synlige og intakte", "help_text": null},
    {"id": "11", "category": "Maskiner og utstyr", "checkpoint": "Maskiner har nødvendig vern og skjerming", "help_text": null},
    {"id": "12", "category": "Maskiner og utstyr", "checkpoint": "Nødstopp fungerer og er lett tilgjengelig", "help_text": null},
    {"id": "13", "category": "Maskiner og utstyr", "checkpoint": "Maskiner og utstyr er vedlikeholdt og uten synlige skader", "help_text": null},
    {"id": "14", "category": "Maskiner og utstyr", "checkpoint": "Brukere av maskiner har fått nødvendig opplæring", "help_text": null},
    {"id": "15", "category": "Elektrisk sikkerhet", "checkpoint": "Kabler og ledninger er uten skader og ikke til hinder", "help_text": null},
    {"id": "16", "category": "Elektrisk sikkerhet", "checkpoint": "Stikkontakter, brytere og utstyr er hele og forsvarlig festet", "help_text": null},
    {"id": "17", "category": "Elektrisk sikkerhet", "checkpoint": "Skjøteledninger brukes ikke som permanent løsning", "help_text": null},
    {"id": "18", "category": "Elektrisk sikkerhet", "checkpoint": "Tilgang til sikringsskap og hovedbryter er fri", "help_text": null},
    {"id": "19", "category": "Kjemikalier", "checkpoint": "Kjemikalier er registrert og dokumentasjon (SDS) er tilgjengelig", "help_text": null},
    {"id": "20", "category": "Kjemikalier", "checkpoint": "Beholdere og flasker er korrekt merket", "help_text": null},
    {"id": "21", "category": "Kjemikalier", "checkpoint": "Kjemikalier lagres forsvarlig og adskilt ved behov", "help_text": null},
    {"id": "22", "category": "Kjemikalier", "checkpoint": "Riktig verneutstyr er tilgjengelig ved bruk av kjemikalier", "help_text": null},
    {"id": "23", "category": "Brannvern og beredskap", "checkpoint": "Slokkeutstyr er på plass, merket og lett tilgjengelig", "help_text": null},
    {"id": "24", "category": "Brannvern og beredskap", "checkpoint": "Brannalarmanlegg og detektorer er synlige og ikke tildekket", "help_text": null},
    {"id": "25", "category": "Brannvern og beredskap", "checkpoint": "Fluktveier og nødutganger er ryddige og merkede", "help_text": null},
    {"id": "26", "category": "Brannvern og beredskap", "checkpoint": "Branninstruks / evakueringsplan er kjent for de ansatte", "help_text": null},
    {"id": "27", "category": "Ergonomi", "checkpoint": "Arbeidshøyde og utforming av arbeidsplassen er tilpasset", "help_text": null},
    {"id": "28", "category": "Ergonomi", "checkpoint": "Tunge løft er vurdert og hjelpemidler er tilgjengelige", "help_text": null},
    {"id": "29", "category": "Ergonomi", "checkpoint": "Skjermarbeidsplasser er ergonomisk tilpasset", "help_text": null},
    {"id": "30", "category": "Ergonomi", "checkpoint": "Mulighet for variasjon i arbeidsstilling og pauser", "help_text": null},
    {"id": "31", "category": "Psykososialt", "checkpoint": "Samarbeid og kommunikasjon oppleves som god", "help_text": null},
    {"id": "32", "category": "Psykososialt", "checkpoint": "Trivsel og arbeidsmiljø er generelt godt", "help_text": null},
    {"id": "33", "category": "Psykososialt", "checkpoint": "Arbeidsmengde og tidsfrister er håndterbare", "help_text": null},
    {"id": "34", "category": "Psykososialt", "checkpoint": "Det finnes kjente rutiner for å varsle om kritikkverdige forhold", "help_text": null},
    {"id": "35", "category": "Verneutstyr", "checkpoint": "Påkrevd verneutstyr er tilgjengelig der det trengs", "help_text": null},
    {"id": "36", "category": "Verneutstyr", "checkpoint": "Verneutstyr brukes i tråd med krav og rutiner", "help_text": null},
    {"id": "37", "category": "Verneutstyr", "checkpoint": "Verneutstyr er helt, rent og funksjonelt", "help_text": null}
  ]'::jsonb,
  true,
  true
),
(
  'Kartlegging av arbeidsmiljøet',
  'Omfattende kartlegging med fokus på HMS, internkontroll, ergonomi og psykososiale faktorer',
  '[
    {"id": "1", "category": "HMS og internkontroll", "checkpoint": "Det nettbaserte HMS-styringssystemet er tilpasset virksomheten", "help_text": null},
    {"id": "2", "category": "HMS og internkontroll", "checkpoint": "Ansatte er kjent med styringssystemet", "help_text": null},
    {"id": "3", "category": "HMS og internkontroll", "checkpoint": "Ansvarsområder er avklart", "help_text": null},
    {"id": "4", "category": "HMS og internkontroll", "checkpoint": "Plan for HMS-arbeidet er utarbeidet/fulgt", "help_text": null},
    {"id": "5", "category": "Ergonomi", "checkpoint": "Utformingen av arbeidsplassen er hensiktsmessig (utstyr/hjelpemidler)", "help_text": null},
    {"id": "6", "category": "Ergonomi", "checkpoint": "Arbeidsplassen gir muligheter for pauser, avlastning og rotasjon", "help_text": null},
    {"id": "7", "category": "Ergonomi", "checkpoint": "Statiske arbeidsoperasjoner unngås", "help_text": null},
    {"id": "8", "category": "Ergonomi", "checkpoint": "Vi er bevisst på at rullering i arbeidet forebygger sykdom", "help_text": null},
    {"id": "9", "category": "Ergonomi", "checkpoint": "Arbeidshøyde på kontorpulter er tilpasset", "help_text": null},
    {"id": "10", "category": "Psykososiale faktorer", "checkpoint": "Alle ansatte har gyldig arbeidskontrakt og arbeidsbeskrivelse", "help_text": null},
    {"id": "11", "category": "Psykososiale faktorer", "checkpoint": "Nødvendig opplæring blir gitt", "help_text": null},
    {"id": "12", "category": "Psykososiale faktorer", "checkpoint": "Bedriften har gode rutiner for oppfølging av sykemeldte", "help_text": null},
    {"id": "13", "category": "Psykososiale faktorer", "checkpoint": "Arbeidsmengden er fordelt blant de ansatte", "help_text": null},
    {"id": "14", "category": "Psykososiale faktorer", "checkpoint": "Det blir utført jevnlig medarbeidersamtaler", "help_text": null},
    {"id": "15", "category": "Brannøvelser og opplæring", "checkpoint": "Alle ansatte kan bruke brannslukningsapparat", "help_text": null},
    {"id": "16", "category": "Brannøvelser og opplæring", "checkpoint": "Brann- og rømningsøvelser gjennomføres regelmessig", "help_text": null},
    {"id": "17", "category": "Brannøvelser og opplæring", "checkpoint": "Branninstruks er utarbeidet og synlig", "help_text": null},
    {"id": "18", "category": "Brannøvelser og opplæring", "checkpoint": "Slukningsutstyr sjekkes årlig", "help_text": null},
    {"id": "19", "category": "Helsefarlige kjemikalier", "checkpoint": "Bedriften har kontroll over oppbevaring og bruk av helseskadelige stoffer", "help_text": null},
    {"id": "20", "category": "Helsefarlige kjemikalier", "checkpoint": "Det er utarbeidet stoffkartotek med tilhørende datablad", "help_text": null},
    {"id": "21", "category": "Helsefarlige kjemikalier", "checkpoint": "Stoffkartoteket er tilgjengelig for alle", "help_text": null},
    {"id": "22", "category": "Helsefarlige kjemikalier", "checkpoint": "Kjemikaliene er oppbevart forsvarlig og merket", "help_text": null},
    {"id": "23", "category": "Fysiske faktorer", "checkpoint": "Opplæring i risiko ved tung og ensformig arbeid er gitt", "help_text": null},
    {"id": "24", "category": "Fysiske faktorer", "checkpoint": "Arbeidsplassen er tilrettelagt for det arbeidet som skal utføres", "help_text": null},
    {"id": "25", "category": "Fysiske faktorer", "checkpoint": "Det er tilfredsstillende ventilasjon på arbeidsplassen", "help_text": null},
    {"id": "26", "category": "Løfte og bærearbeid", "checkpoint": "Arbeidet organiseres slik at det unngås tunge løft", "help_text": null},
    {"id": "27", "category": "Løfte og bærearbeid", "checkpoint": "Det er tilgjengelig hjelpemidler ved tunge løft", "help_text": null},
    {"id": "28", "category": "Løfte og bærearbeid", "checkpoint": "Vridde stillinger unngås", "help_text": null},
    {"id": "29", "category": "Ensformig arbeid", "checkpoint": "En har mulighet til å bestemme eget arbeidstempo", "help_text": null},
    {"id": "30", "category": "Ensformig arbeid", "checkpoint": "Det er mulighet for pause ved behov", "help_text": null}
  ]'::jsonb,
  true,
  true
),
(
  'Vernerunde - Byggeplass (SHA)',
  'Spesialtilpasset for byggeplasser med fokus på SHA og ytre miljø',
  '[
    {"id": "1", "category": "Byggeplass/riggområde", "checkpoint": "Inngjerding og adgangskontroll er på plass", "help_text": null},
    {"id": "2", "category": "Byggeplass/riggområde", "checkpoint": "Sikring av skråninger/byggegrop", "help_text": null},
    {"id": "3", "category": "Byggeplass/riggområde", "checkpoint": "Ferdsel er trygg og godt organisert", "help_text": null},
    {"id": "4", "category": "Byggeplass/riggområde", "checkpoint": "Ingen klager på støy, støv etc.", "help_text": null},
    {"id": "5", "category": "Arbeid i høyden", "checkpoint": "Sikring av arbeidsområder i høyden", "help_text": null},
    {"id": "6", "category": "Arbeid i høyden", "checkpoint": "Sikring av arbeidstakere (sele) kontrollert", "help_text": null},
    {"id": "7", "category": "Arbeid i høyden", "checkpoint": "Stillaser er kontrollert/godkjent", "help_text": null},
    {"id": "8", "category": "Arbeid i høyden", "checkpoint": "Oppstilling/forankring av stillaser er korrekt", "help_text": null},
    {"id": "9", "category": "Arbeidsutstyr", "checkpoint": "Ettersyn/kontroll/sertifikater er i orden", "help_text": null},
    {"id": "10", "category": "Arbeidsutstyr", "checkpoint": "Opplæring er dokumentert", "help_text": null},
    {"id": "11", "category": "Løfteoperasjoner", "checkpoint": "Understøtting og stabilitet sjekket", "help_text": null},
    {"id": "12", "category": "Løfteoperasjoner", "checkpoint": "Sving- og dekningsområde er avklart", "help_text": null},
    {"id": "13", "category": "Løfteoperasjoner", "checkpoint": "Sikring av last/fallområde", "help_text": null},
    {"id": "14", "category": "Løfteoperasjoner", "checkpoint": "Kontroll/sertifikater er gyldige", "help_text": null},
    {"id": "15", "category": "Varme arbeider", "checkpoint": "Arbeidstillatelser er utstedt", "help_text": null},
    {"id": "16", "category": "Varme arbeider", "checkpoint": "Personlig verneutstyr brukes", "help_text": null},
    {"id": "17", "category": "Varme arbeider", "checkpoint": "Brannslukkingsutstyr er tilgjengelig", "help_text": null},
    {"id": "18", "category": "Helse- og miljøfarlige stoffer", "checkpoint": "Stoffkartotek er ajourført", "help_text": null},
    {"id": "19", "category": "Helse- og miljøfarlige stoffer", "checkpoint": "Opplæring i håndtering er gitt", "help_text": null},
    {"id": "20", "category": "Helse- og miljøfarlige stoffer", "checkpoint": "Verneutstyr brukes korrekt", "help_text": null},
    {"id": "21", "category": "Lagring av farlige stoffer", "checkpoint": "Plassering er forsvarlig", "help_text": null},
    {"id": "22", "category": "Lagring av farlige stoffer", "checkpoint": "Sikring er tilfredsstillende", "help_text": null},
    {"id": "23", "category": "Lagring av farlige stoffer", "checkpoint": "Beredskapsutstyr er tilgjengelig", "help_text": null},
    {"id": "24", "category": "Beredskapsutstyr", "checkpoint": "Plassering er godt synlig", "help_text": null},
    {"id": "25", "category": "Beredskapsutstyr", "checkpoint": "Utstyret er tilgjengelig og egnet", "help_text": null},
    {"id": "26", "category": "Beredskapsutstyr", "checkpoint": "Opplæring i bruk er gitt", "help_text": null},
    {"id": "27", "category": "Personlig verneutstyr", "checkpoint": "Verneutstyr brukes på byggeplassen", "help_text": null},
    {"id": "28", "category": "Personlig verneutstyr", "checkpoint": "Verneutstyr er tilgjengelig og egnet", "help_text": null},
    {"id": "29", "category": "Avfallshåndtering", "checkpoint": "Sortering iht. avfallsplan", "help_text": null},
    {"id": "30", "category": "Avfallshåndtering", "checkpoint": "Lagring av farlig avfall er forsvarlig", "help_text": null},
    {"id": "31", "category": "Spisebrakker/oppholdsrom", "checkpoint": "Orden og ryddighet", "help_text": null},
    {"id": "32", "category": "Spisebrakker/oppholdsrom", "checkpoint": "Renhold er tilfredsstillende", "help_text": null},
    {"id": "33", "category": "Samordning av HMS", "checkpoint": "Samtidige aktiviteter er koordinert", "help_text": null},
    {"id": "34", "category": "Samordning av HMS", "checkpoint": "Lager- og arbeidsområder er tilrettelagt", "help_text": null}
  ]'::jsonb,
  true,
  true
),
(
  'Enkel vernerunde',
  'Forenklet sjekkliste med hovedtemaer for rask gjennomgang',
  '[
    {"id": "1", "category": "Trivsel og organisatorisk arbeidsmiljø", "checkpoint": "Opplæring er tilstrekkelig", "help_text": null},
    {"id": "2", "category": "Trivsel og organisatorisk arbeidsmiljø", "checkpoint": "Informasjon og medbestemmelse fungerer", "help_text": null},
    {"id": "3", "category": "Trivsel og organisatorisk arbeidsmiljø", "checkpoint": "Mellommenneskelige forhold er gode", "help_text": null},
    {"id": "4", "category": "Fysiske og kjemiske forhold", "checkpoint": "Ergonomi og arbeidsstillinger er tilfredsstillende", "help_text": null},
    {"id": "5", "category": "Fysiske og kjemiske forhold", "checkpoint": "Ventilasjon/klima og luftkvalitet er OK", "help_text": null},
    {"id": "6", "category": "Fysiske og kjemiske forhold", "checkpoint": "Kjemikalier/gasser/løsemidler håndteres korrekt", "help_text": null},
    {"id": "7", "category": "Fysiske og kjemiske forhold", "checkpoint": "HMS-datablad/stoffkartotek er tilgjengelig", "help_text": null},
    {"id": "8", "category": "Fysiske og kjemiske forhold", "checkpoint": "Støv kontrolleres tilfredsstillende", "help_text": null},
    {"id": "9", "category": "Fysiske og kjemiske forhold", "checkpoint": "Belysning er tilstrekkelig", "help_text": null},
    {"id": "10", "category": "Fysiske og kjemiske forhold", "checkpoint": "Støy er under kontroll", "help_text": null},
    {"id": "11", "category": "Utstyr og lokaler", "checkpoint": "Arbeidslokaler er i god stand", "help_text": null},
    {"id": "12", "category": "Utstyr og lokaler", "checkpoint": "Redskapsrom er ryddige", "help_text": null},
    {"id": "13", "category": "Utstyr og lokaler", "checkpoint": "Personalrom er tilfredsstillende", "help_text": null},
    {"id": "14", "category": "Utstyr og lokaler", "checkpoint": "Vedlikehold av maskiner og utstyr utføres", "help_text": null},
    {"id": "15", "category": "Orden og avfall", "checkpoint": "Orden og rengjøring er tilfredsstillende", "help_text": null},
    {"id": "16", "category": "Orden og avfall", "checkpoint": "Spesialavfall håndteres korrekt", "help_text": null},
    {"id": "17", "category": "Orden og avfall", "checkpoint": "Søppelhåndtering fungerer", "help_text": null},
    {"id": "18", "category": "Sikkerhet", "checkpoint": "Verneutstyr er tilgjengelig og brukes", "help_text": null},
    {"id": "19", "category": "Sikkerhet", "checkpoint": "Nødstopp maskiner fungerer", "help_text": null},
    {"id": "20", "category": "Sikkerhet", "checkpoint": "Førstehjelpsutstyr er tilgjengelig", "help_text": null},
    {"id": "21", "category": "Sikkerhet", "checkpoint": "Ulykker og uønskede hendelser rapporteres", "help_text": null},
    {"id": "22", "category": "Brannvern og elektrisk", "checkpoint": "Brannvernapparater er på plass", "help_text": null},
    {"id": "23", "category": "Brannvern og elektrisk", "checkpoint": "Rømmingsveier er frie", "help_text": null},
    {"id": "24", "category": "Brannvern og elektrisk", "checkpoint": "Røykvarslere fungerer", "help_text": null},
    {"id": "25", "category": "Brannvern og elektrisk", "checkpoint": "Opplæring i brannslukking er gitt", "help_text": null},
    {"id": "26", "category": "Brannvern og elektrisk", "checkpoint": "Kontroll/vedlikehold av elektrisk utstyr utføres", "help_text": null}
  ]'::jsonb,
  true,
  true
);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_hms_vernerunde_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_hms_vernerunde_templates_updated_at
BEFORE UPDATE ON public.hms_vernerunde_templates
FOR EACH ROW
EXECUTE FUNCTION update_hms_vernerunde_templates_updated_at();