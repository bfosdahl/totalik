
-- IK Alkohol
INSERT INTO public.company_modules (company_id, module_type, is_active)
VALUES ('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9', 'IK_ALKOHOL', true)
ON CONFLICT (company_id, module_type) DO UPDATE SET is_active = true, is_deleted = false, updated_at = now();

-- Kjølere
INSERT INTO public.ik_mat_temperature_equipment (company_id, name, equipment_type, location, min_temp, max_temp, measurement_frequency, is_active, sort_order)
SELECT 'd292bcc5-c9ba-41a3-b3db-2fb1e06e30c9', 'Kjøler ' || i, 'fridge', 'Kjøkken', 0, 4, 'daily', true, i
FROM generate_series(1,7) AS i;

-- Frysere
INSERT INTO public.ik_mat_temperature_equipment (company_id, name, equipment_type, location, min_temp, max_temp, measurement_frequency, is_active, sort_order)
SELECT 'd292bcc5-c9ba-41a3-b3db-2fb1e06e30c9', 'Fryser ' || i, 'freezer', 'Kjøkken', -25, -18, 'daily', true, 10 + i
FROM generate_series(1,7) AS i;

-- Renholdsplan
INSERT INTO public.ik_mat_custom_cleaning_tasks (company_id, area, frequency, method, responsible, sort_order)
VALUES
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Gulv kjøkken','daily','Feies og vaskes med godkjent rengjøringsmiddel','Kjøkkenansvarlig',1),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Benker og arbeidsflater','daily','Vaskes og desinfiseres','Kjøkkenansvarlig',2),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Utstyr og redskaper','daily','Vaskes i oppvaskmaskin eller for hånd','Kjøkkenansvarlig',3),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Pizzaovn / komfyr','daily','Rengjøres utvendig, rester fjernes','Kjøkkenansvarlig',4),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Sluk','daily','Spyles og rengjøres','Kjøkkenansvarlig',5),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Søppelhåndtering','daily','Tømmes, poser byttes, beholder vaskes ved behov','Kjøkkenansvarlig',6),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Bar/serveringsområde','daily','Vaskes og desinfiseres','Baransvarlig',7),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Avtrekksvifte og hette','weekly','Filter tas ut og vaskes, hette rengjøres','Kjøkkenansvarlig',8),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Vegger og fliser','weekly','Vaskes med såpevann','Kjøkkenansvarlig',9),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Innside kjøleskap','weekly','Tømmes, vaskes og desinfiseres','Kjøkkenansvarlig',10),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Innside frysere','monthly','Tømmes, avrimes og vaskes','Kjøkkenansvarlig',11),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Tørrvarelager','weekly','Ryddes, tørkes av, holdbarhet kontrolleres','Kjøkkenansvarlig',12),
('d292bcc5-c9ba-41a3-b3db-2fb1e06e30c9','Vinduer','monthly','Vaskes innvendig og utvendig','Kjøkkenansvarlig',13);
