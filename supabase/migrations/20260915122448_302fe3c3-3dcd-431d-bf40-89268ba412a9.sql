INSERT INTO public.ik_mat_temperature_equipment (company_id, name, equipment_type, location, min_temp, max_temp, measurement_frequency, sort_order) VALUES
('07105092-ba6b-471e-92bb-30c1854426c5','Kjølerom','fridge','Kjøkken',0,4,'daily',1),
('07105092-ba6b-471e-92bb-30c1854426c5','Kjølebenk 1','cold_display','Kjøkken',0,4,'daily',2),
('07105092-ba6b-471e-92bb-30c1854426c5','Kjølebenk 2','cold_display','Kjøkken',0,4,'daily',3),
('07105092-ba6b-471e-92bb-30c1854426c5','Barkjøler 1','cold_display','Bar',0,4,'daily',4),
('07105092-ba6b-471e-92bb-30c1854426c5','Barkjøler 2','cold_display','Bar',0,4,'daily',5),
('07105092-ba6b-471e-92bb-30c1854426c5','Barkjøler 3','cold_display','Bar',0,4,'daily',6),
('07105092-ba6b-471e-92bb-30c1854426c5','Kjøleskap','fridge','Kjøkken',0,4,'daily',7),
('07105092-ba6b-471e-92bb-30c1854426c5','Oppvaskmaskin 1','dishwasher_pro','Kjøkken',80,100,'daily',8),
('07105092-ba6b-471e-92bb-30c1854426c5','Oppvaskmaskin 2','dishwasher_pro','Kjøkken',80,100,'daily',9);

INSERT INTO public.ik_mat_custom_cleaning_tasks (company_id, area, frequency, method, responsible, sort_order) VALUES
('07105092-ba6b-471e-92bb-30c1854426c5','Gulv kjøkken (2 ganger daglig)','Daglig','Feies og vaskes med godkjent rengjøringsmiddel, to ganger per dag','Kjøkkenansvarlig',1),
('07105092-ba6b-471e-92bb-30c1854426c5','Benker og overflater','Daglig','Vaskes og desinfiseres etter bruk og ved dagens slutt','Kjøkkenansvarlig',2),
('07105092-ba6b-471e-92bb-30c1854426c5','Utstyr','Daglig','Demonteres ved behov, vaskes, desinfiseres og tørkes','Kjøkkenansvarlig',3),
('07105092-ba6b-471e-92bb-30c1854426c5','Ovner','Daglig','Rister og innvendige flater rengjøres etter bruk','Kjøkkenansvarlig',4),
('07105092-ba6b-471e-92bb-30c1854426c5','Sluk','Daglig','Rist løftes, sluk spyles og rengjøres','Kjøkkenansvarlig',5),
('07105092-ba6b-471e-92bb-30c1854426c5','Komfyr','Daglig','Plater og flater rengjøres etter bruk','Kjøkkenansvarlig',6),
('07105092-ba6b-471e-92bb-30c1854426c5','Oppvaskmaskiner (2 stk)','Daglig','Silkurv tømmes og rengjøres, maskin tømmes og vaskes. Temperatur kontrolleres og loggføres','Kjøkkenansvarlig',7),
('07105092-ba6b-471e-92bb-30c1854426c5','Søppelhåndtering','Daglig','Avfall tømmes, beholdere vaskes og nye poser settes i','Kjøkkenansvarlig',8),
('07105092-ba6b-471e-92bb-30c1854426c5','Varmebehandling av mat (temperaturkontroll)','Daglig','Kjernetemperatur måles til minst 75 grader og loggføres','Kjøkkenansvarlig',9),
('07105092-ba6b-471e-92bb-30c1854426c5','Nedkjøling av mat (temperaturkontroll)','Daglig','Mat kjøles fra 60 til 10 grader innen 2 timer. Temperatur loggføres','Kjøkkenansvarlig',10),
('07105092-ba6b-471e-92bb-30c1854426c5','Oppvarming av mat (temperaturkontroll)','Daglig','Mat varmes til minst 75 grader kjernetemperatur og loggføres','Kjøkkenansvarlig',11),
('07105092-ba6b-471e-92bb-30c1854426c5','Temperaturkontroll kjøleskap og frysere','Daglig','Alle kjøle- og fryseenheter kontrolleres og temperaturer loggføres','Kjøkkenansvarlig',12),
('07105092-ba6b-471e-92bb-30c1854426c5','Avtrekksviftehette','Ukentlig','Filter demonteres og vaskes, hette avfettes','Kjøkkenansvarlig',13),
('07105092-ba6b-471e-92bb-30c1854426c5','Vegger','Ukentlig','Vaskes med såpevann, spesielt rundt matlagingssoner','Kjøkkenansvarlig',14),
('07105092-ba6b-471e-92bb-30c1854426c5','Inni kjøleskap','Ukentlig','Tømmes, vaskes og desinfiseres. Utgåtte varer kastes','Kjøkkenansvarlig',15),
('07105092-ba6b-471e-92bb-30c1854426c5','Kjølerom','Ukentlig','Gulv, hyller og flater vaskes og desinfiseres','Kjøkkenansvarlig',16),
('07105092-ba6b-471e-92bb-30c1854426c5','Tørrvarelager','Ukentlig','Hyller og gulv rengjøres, varer kontrolleres for holdbarhet','Kjøkkenansvarlig',17),
('07105092-ba6b-471e-92bb-30c1854426c5','Vinduer','Månedlig','Vinduer vaskes innvendig og utvendig','Kjøkkenansvarlig',18);

INSERT INTO public.ik_mat_daily_task_settings (company_id, task_type, task_name, frequency, reminder_time, reminder_enabled) VALUES
('07105092-ba6b-471e-92bb-30c1854426c5','temperature','Temperaturkontroll kjøl, frys og oppvask','daily','09:00',true),
('07105092-ba6b-471e-92bb-30c1854426c5','cleaning','Daglig renhold kjøkken','daily','08:00',true);