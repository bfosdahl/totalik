// IK/FDV Module Types - Forvaltning, Drift og Vedlikehold

export interface FdvBuilding {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  owner_type: 'eier' | 'leietaker';
  building_type: 'kontor' | 'butikk' | 'lager' | 'verksted' | 'kombinasjon';
  area_sqm: number | null;
  floors: number;
  usage_type: 'ansatte' | 'publikum' | 'begge';
  internal_contact_name: string | null;
  internal_contact_phone: string | null;
  internal_contact_email: string | null;
  external_contact_name: string | null;
  external_contact_phone: string | null;
  external_contact_email: string | null;
  image_url: string | null;
  notes: string | null;
  status: 'aktiv' | 'inaktiv';
  created_at: string;
  updated_at: string;
}

export interface FdvBuildingRole {
  id: string;
  building_id: string;
  company_id: string;
  role_type: 'eier' | 'bruker' | 'brannvernleder' | 'vaktmester' | 'utleier' | 'driftsansvarlig';
  person_name: string | null;
  profile_id: string | null;
  external_actor: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FdvControl {
  id: string;
  building_id: string;
  company_id: string;
  control_type: FdvControlType;
  name: string;
  description: string | null;
  interval_months: number;
  responsible_id: string | null;
  responsible_name: string | null;
  status: 'planlagt' | 'utfort' | 'forfalt' | 'avvik';
  next_due_date: string | null;
  last_completed_date: string | null;
  last_completed_by_id: string | null;
  last_completed_by_name: string | null;
  documentation_path: string | null;
  notes: string | null;
  reminder_enabled: boolean;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
}

export type FdvControlType = 
  | 'brannalarm' 
  | 'slokkeutstyr' 
  | 'nodlys' 
  | 'el_kontroll' 
  | 'termografering' 
  | 'ventilasjon' 
  | 'tak_fasade' 
  | 'heis' 
  | 'romningsveier' 
  | 'sprinkler' 
  | 'annet';

export interface FdvControlLog {
  id: string;
  control_id: string;
  building_id: string;
  company_id: string;
  completed_at: string;
  completed_by_id: string | null;
  completed_by_name: string;
  status: 'ok' | 'avvik' | 'delvis_ok';
  findings: string | null;
  documentation_path: string | null;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface FdvRiskAssessment {
  id: string;
  building_id: string;
  company_id: string;
  category: FdvRiskCategory;
  hazard_description: string;
  existing_measures: string | null;
  probability: number;
  consequence: number;
  risk_score: number;
  status: 'aktiv' | 'under_behandling' | 'lukket';
  actions: FdvRiskAction[];
  responsible_id: string | null;
  responsible_name: string | null;
  revision_date: string | null;
  assessed_by_id: string | null;
  assessed_by_name: string | null;
  assessed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FdvRiskCategory = 
  | 'brann' 
  | 'elektrisk' 
  | 'inneklima' 
  | 'fall_skli' 
  | 'teknisk_svikt' 
  | 'fuktskader' 
  | 'sikkerhet' 
  | 'annet';

export interface FdvRiskAction {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
  status: 'planlagt' | 'pagaende' | 'fullfort';
  completed_at?: string;
}

export interface FdvDocument {
  id: string;
  building_id: string | null;
  company_id: string;
  category: FdvDocumentCategory;
  document_name: string;
  description: string | null;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  version: string;
  valid_from: string | null;
  valid_to: string | null;
  uploaded_by_id: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export type FdvDocumentCategory = 
  | 'tegninger' 
  | 'samsvarserklaeringer' 
  | 'kontrollrapporter' 
  | 'serviceavtaler' 
  | 'branninstrukser' 
  | 'vedlikeholdsplaner'
  | 'leiekontrakt'
  | 'ansvarsavtale'
  | 'annet';

// Label mappings for UI
export const FDV_CONTROL_TYPE_LABELS: Record<FdvControlType, string> = {
  brannalarm: 'Brannalarm - service',
  slokkeutstyr: 'Slokkeutstyr - kontroll',
  nodlys: 'Nødlys - funksjonstest',
  el_kontroll: 'El-kontroll (NEK 405)',
  termografering: 'Termografering',
  ventilasjon: 'Ventilasjon / filterskift',
  tak_fasade: 'Tak og fasade',
  heis: 'Heis - service',
  romningsveier: 'Rømningsveier',
  sprinkler: 'Sprinkler - service',
  annet: 'Annet',
};

export const FDV_RISK_CATEGORY_LABELS: Record<FdvRiskCategory, string> = {
  brann: 'Brann',
  elektrisk: 'Elektrisk anlegg',
  inneklima: 'Inneklima / ventilasjon',
  fall_skli: 'Fall, skli, trapper',
  teknisk_svikt: 'Teknisk svikt',
  fuktskader: 'Fuktskader',
  sikkerhet: 'Sikkerhet',
  annet: 'Annet',
};

export const FDV_DOCUMENT_CATEGORY_LABELS: Record<FdvDocumentCategory, string> = {
  tegninger: 'Tegninger',
  samsvarserklaeringer: 'Samsvarserklæringer',
  kontrollrapporter: 'Kontrollrapporter',
  serviceavtaler: 'Serviceavtaler',
  branninstrukser: 'Branninstrukser',
  vedlikeholdsplaner: 'Vedlikeholdsplaner',
  leiekontrakt: 'Leiekontrakt',
  ansvarsavtale: 'Ansvarsavtale',
  annet: 'Annet',
};

export const FDV_BUILDING_ROLE_LABELS: Record<FdvBuildingRole['role_type'], string> = {
  eier: 'Eier',
  bruker: 'Bruker',
  brannvernleder: 'Brannvernleder',
  vaktmester: 'Drift / Vaktmester',
  utleier: 'Utleier',
  driftsansvarlig: 'Driftsansvarlig',
};

export const FDV_BUILDING_TYPE_LABELS: Record<FdvBuilding['building_type'], string> = {
  kontor: 'Kontor',
  butikk: 'Butikk',
  lager: 'Lager',
  verksted: 'Verksted',
  kombinasjon: 'Kombinasjon',
};

export const FDV_OWNER_TYPE_LABELS: Record<FdvBuilding['owner_type'], string> = {
  eier: 'Eier',
  leietaker: 'Leietaker',
};

export const FDV_USAGE_TYPE_LABELS: Record<FdvBuilding['usage_type'], string> = {
  ansatte: 'Kun ansatte',
  publikum: 'Kun publikum',
  begge: 'Ansatte og publikum',
};
