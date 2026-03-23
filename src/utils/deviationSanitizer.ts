/**
 * Deviation Data Sanitizer
 * 
 * Ensures all deviation data is properly formatted before database operations.
 * Prevents null/undefined errors and ensures type safety.
 * 
 * CANONICAL STATUS VALUES (used everywhere: DB, UI, sanitizer):
 *   "open" | "in-progress" | "resolved" | "closed"
 */

import { DeviationCategory } from '@/hooks/useDeviations';

// Deviation type values
export type DeviationType = 'deviation' | 'observation' | 'improvement' | 'work_accident';

// Canonical status type — single source of truth
export type DeviationStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

// Valid categories that match database constraints
const VALID_CATEGORIES: DeviationCategory[] = ['quality', 'safety', 'environment', 'documentation', 'other', 'process', 'equipment', 'personnel', 'temperature', 'cleaning', 'pest_control', 'allergen', 'traceability', 'hygiene', 'storage', 'pests', 'expiry', 'contamination', 'receiving', 'other_food'];
const VALID_TYPES: DeviationType[] = ['deviation', 'observation', 'improvement', 'work_accident'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const VALID_STATUSES: DeviationStatus[] = ['open', 'in-progress', 'resolved', 'closed'];

type Priority = typeof VALID_PRIORITIES[number];

/**
 * Safely converts any value to a string, returning empty string for null/undefined
 */
export const safeString = (value: unknown, defaultValue = ''): string => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
};

/**
 * Safely converts any value to a string or null for optional fields
 */
export const safeStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value.trim() || null;
  return String(value).trim() || null;
};

/**
 * Safely converts any value to a boolean
 */
export const safeBoolean = (value: unknown, defaultValue = false): boolean => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

/**
 * Validates and returns a valid category
 */
export const safeCategory = (value: unknown): DeviationCategory => {
  const strValue = safeString(value, 'other').toLowerCase();
  
  // Direct match
  if (VALID_CATEGORIES.includes(strValue as DeviationCategory)) {
    return strValue as DeviationCategory;
  }
  
  // Map legacy/incorrect values to valid categories
  const categoryMap: Record<string, DeviationCategory> = {
    'hms': 'safety',
    'kvalitet': 'quality',
    'sikkerhet': 'safety',
    'miljø': 'environment',
    'miljo': 'environment',
    'prosedyrer': 'process',
    'utstyr': 'equipment',
    'annet': 'other',
    'mat': 'quality',
    'bygg': 'quality',
    'procedures': 'process',
  };
  
  return categoryMap[strValue] || 'other';
};

/**
 * Validates and returns a valid type
 */
export const safeType = (value: unknown): DeviationType => {
  const strValue = safeString(value, 'deviation').toLowerCase();
  
  if (VALID_TYPES.includes(strValue as DeviationType)) {
    return strValue as DeviationType;
  }
  
  // Map legacy values
  const typeMap: Record<string, DeviationType> = {
    'avvik': 'deviation',
    'observasjon': 'observation',
    'forbedring': 'improvement',
    'arbeidsulykke': 'work_accident',
  };
  
  return typeMap[strValue] || 'deviation';
};

/**
 * Validates and returns a valid priority
 */
export const safePriority = (value: unknown): Priority => {
  const strValue = safeString(value, 'medium').toLowerCase();
  
  if (VALID_PRIORITIES.includes(strValue as Priority)) {
    return strValue as Priority;
  }
  
  // Map Norwegian values
  const priorityMap: Record<string, Priority> = {
    'lav': 'low',
    'middels': 'medium',
    'høy': 'high',
    'hoy': 'high',
    'kritisk': 'critical',
  };
  
  return priorityMap[strValue] || 'medium';
};

/**
 * Validates and returns a valid status.
 * Maps legacy DB values (in_progress, cancelled) to canonical UI values.
 */
export const safeStatus = (value: unknown): DeviationStatus => {
  const strValue = safeString(value, 'open').toLowerCase();
  
  if (VALID_STATUSES.includes(strValue as DeviationStatus)) {
    return strValue as DeviationStatus;
  }
  
  // Map legacy DB values and Norwegian values to canonical status
  const statusMap: Record<string, DeviationStatus> = {
    'in_progress': 'in-progress',
    'åpen': 'open',
    'apen': 'open',
    'pågår': 'in-progress',
    'pagar': 'in-progress',
    'under_behandling': 'in-progress',
    'lukket': 'closed',
    'avsluttet': 'closed',
    'resolved': 'resolved',
    'cancelled': 'closed',
    'kansellert': 'closed',
  };
  
  return statusMap[strValue] || 'open';
};

/**
 * Extracts time from various input formats and returns HH:MM:SS format
 * Returns null if input is a date-only string (YYYY-MM-DD) without time component
 */
export const safeTimeFormat = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  
  // Handle Date object
  if (value instanceof Date) {
    return null;
  }
  
  const strValue = safeString(value);
  if (!strValue) return null;
  
  // Check if it's a date-only format (YYYY-MM-DD) - return null as we can't extract time
  if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
    return null;
  }
  
  // Handle datetime-local format (YYYY-MM-DDTHH:MM)
  if (strValue.includes('T')) {
    const timePart = strValue.split('T')[1];
    if (timePart) {
      const [hours, minutes] = timePart.split(':');
      if (hours && minutes) {
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      }
    }
  }
  
  // Handle time-only format (HH:MM or HH:MM:SS)
  const timeMatch = strValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const [, hours, minutes, seconds = '00'] = timeMatch;
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
  
  return null;
};

/**
 * Validates and formats a date string
 */
export const safeDateFormat = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  
  const strValue = safeString(value);
  if (!strValue) return null;
  
  // Try to parse as ISO date
  const date = new Date(strValue);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
};

/**
 * Sanitizes deviation data for database insert/update
 */
export interface DeviationInput {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  type?: unknown;
  priority?: unknown;
  status?: unknown;
  due_date?: unknown;
  reporter_name?: unknown;
  reporter_id?: unknown;
  reporter_contact?: unknown;
  assignee_id?: unknown;
  assignee_name?: unknown;
  department_id?: unknown;
  project_id?: unknown;
  incident_time?: unknown;
  incident_location?: unknown;
  incident_type?: unknown;
  severity?: unknown;
  involved_persons?: unknown;
  consequences?: unknown;
  immediate_actions?: unknown;
  root_cause_analysis?: unknown;
  preventive_measures?: unknown;
  additional_info?: unknown;
  notify_arbeidstilsynet?: unknown;
  notify_insurance?: unknown;
  reporter_signature?: unknown;
  receiver_signature?: unknown;
  responsible_receiver?: unknown;
  signed_at?: unknown;
}

export interface SanitizedDeviation {
  title: string;
  description: string | null;
  category: DeviationCategory;
  type: DeviationType;
  priority: string;
  status: DeviationStatus;
  due_date: string;
  reporter_name: string;
  reporter_id: string | null;
  reporter_contact: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  department_id: string | null;
  project_id: string | null;
  incident_time: string | null;
  incident_location: string | null;
  incident_type: string | null;
  severity: string | null;
  involved_persons: string | null;
  consequences: string | null;
  immediate_actions: string | null;
  root_cause_analysis: string | null;
  preventive_measures: string | null;
  additional_info: string | null;
  notify_arbeidstilsynet: boolean;
  notify_insurance: boolean;
  reporter_signature: string | null;
  receiver_signature: string | null;
  responsible_receiver: string | null;
  signed_at: string | null;
}

export const sanitizeDeviationForInsert = (data: DeviationInput): SanitizedDeviation => {
  // Default due date to 14 days from now if not provided
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  
  return {
    title: safeString(data.title, 'Uten tittel'),
    description: safeStringOrNull(data.description),
    category: safeCategory(data.category),
    type: safeType(data.type),
    priority: safePriority(data.priority),
    status: safeStatus(data.status),
    due_date: safeDateFormat(data.due_date) || defaultDueDate.toISOString().split('T')[0],
    reporter_name: safeString(data.reporter_name, 'Ukjent'),
    reporter_id: safeStringOrNull(data.reporter_id),
    reporter_contact: safeStringOrNull(data.reporter_contact),
    assignee_id: safeStringOrNull(data.assignee_id),
    assignee_name: safeStringOrNull(data.assignee_name),
    department_id: safeStringOrNull(data.department_id),
    project_id: safeStringOrNull(data.project_id),
    incident_time: safeTimeFormat(data.incident_time),
    incident_location: safeStringOrNull(data.incident_location),
    incident_type: safeStringOrNull(data.incident_type),
    severity: safeStringOrNull(data.severity),
    involved_persons: safeStringOrNull(data.involved_persons),
    consequences: safeStringOrNull(data.consequences),
    immediate_actions: safeStringOrNull(data.immediate_actions),
    root_cause_analysis: safeStringOrNull(data.root_cause_analysis),
    preventive_measures: safeStringOrNull(data.preventive_measures),
    additional_info: safeStringOrNull(data.additional_info),
    notify_arbeidstilsynet: safeBoolean(data.notify_arbeidstilsynet),
    notify_insurance: safeBoolean(data.notify_insurance),
    reporter_signature: safeStringOrNull(data.reporter_signature),
    receiver_signature: safeStringOrNull(data.receiver_signature),
    responsible_receiver: safeStringOrNull(data.responsible_receiver),
    signed_at: safeStringOrNull(data.signed_at),
  };
};

/**
 * Sanitizes deviation data for display
 */
export const sanitizeDeviationForDisplay = (data: Record<string, unknown>) => {
  return {
    ...data,
    title: safeString(data.title, 'Uten tittel'),
    description: safeString(data.description, ''),
    category: safeCategory(data.category),
    type: safeType(data.type),
    priority: safePriority(data.priority),
    status: safeStatus(data.status),
    reporter_name: safeString(data.reporter_name, 'Ukjent'),
  };
};

/**
 * Get display label for category
 */
export const getCategoryLabel = (category: DeviationCategory): string => {
  const labels: Record<DeviationCategory, string> = {
    quality: 'Kvalitet',
    safety: 'Sikkerhet',
    environment: 'Miljø',
    documentation: 'Dokumentasjon',
    process: 'Prosess',
    equipment: 'Utstyr',
    personnel: 'Personell',
    other: 'Annet',
    temperature: 'Temperaturavvik',
    cleaning: 'Renhold',
    pest_control: 'Skadedyr',
    allergen: 'Allergenhåndtering',
    traceability: 'Sporbarhet',
    hygiene: 'Hygiene',
    storage: 'Lagring',
    pests: 'Skadedyr',
    expiry: 'Utgått holdbarhet',
    contamination: 'Krysskontaminering',
    receiving: 'Varemottak',
    other_food: 'Annet matsikkerhet',
  };
  return labels[category] || 'Annet';
};

/**
 * Get display label for type
 */
export const getTypeLabel = (type: DeviationType): string => {
  const labels: Record<DeviationType, string> = {
    deviation: 'Avvik',
    observation: 'Observasjon',
    improvement: 'Forbedring',
    work_accident: 'Arbeidsulykke',
  };
  return labels[type] || 'Avvik';
};
