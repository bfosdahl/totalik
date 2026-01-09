/**
 * Handbook PDF Data Sanitizer
 * 
 * This utility ensures all data passed to PDF generation is properly
 * sanitized and has safe default values to prevent runtime errors.
 * 
 * Common errors prevented:
 * - Cannot read properties of undefined (reading 'toString')
 * - Cannot read properties of null
 * - undefined is not iterable
 * - x.map is not a function
 */

// ============= SAFE VALUE HELPERS =============

/**
 * Safely convert any value to a number, with fallback
 */
export const safeNumber = (value: unknown, fallback: number = 0): number => {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Safely convert any value to a string, with fallback
 */
export const safeString = (value: unknown, fallback: string = ""): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

/**
 * Safely get an array, returns empty array if not an array
 */
export const safeArray = <T>(value: unknown, fallback: T[] = []): T[] => {
  if (!value) return fallback;
  if (!Array.isArray(value)) return fallback;
  return value;
};

/**
 * Safely truncate a string to a maximum length
 */
export const safeTruncate = (value: unknown, maxLength: number, suffix: string = "..."): string => {
  const str = safeString(value);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

// ============= DATA INTERFACES =============

export interface SanitizedGoal {
  id: string;
  goal_text: string;
  is_predefined: boolean;
}

export interface SanitizedRole {
  id: string;
  title: string;
  personName: string;
  description: string;
  sortOrder: number;
}

export interface SanitizedOrganization {
  roles: SanitizedRole[];
  description: string;
}

export interface SanitizedRisk {
  id: string;
  description: string;
  probability: number;
  consequence: number;
  riskValue: number;
  riskLevel: string;
  existing_measures: string;
  planned_measures: string;
}

export interface SanitizedAction {
  id: string;
  risk_id: string;
  risk_description: string;
  action_description: string;
  responsible: string;
  deadline: string;
  status: string;
  statusLabel: string;
  priority: string;
  comments: string;
}

export interface SanitizedRoutine {
  id: string;
  routine_number: string;
  routine_name: string;
  category: string;
  purpose: string;
  responsibility: string;
  procedure: string;
  examples: string;
  remember: string;
  is_predefined: boolean;
}

export interface SanitizedLaw {
  id: string;
  law_name: string;
  category: string;
  description: string;
  link: string;
}

export interface SanitizedCompanyInfo {
  id: string;
  name: string;
  org_number: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  logo_url: string | null;
}

export interface SanitizedHandbookData {
  companyInfo: SanitizedCompanyInfo;
  goals: SanitizedGoal[];
  organization: SanitizedOrganization;
  risks: SanitizedRisk[];
  actions: SanitizedAction[];
  routines: SanitizedRoutine[];
  laws: SanitizedLaw[];
}

// ============= SANITIZERS =============

/**
 * Get risk level text from risk value
 */
export const getRiskLevelText = (value: number): string => {
  if (value <= 4) return "Lav";
  if (value <= 9) return "Moderat";
  if (value <= 15) return "Høy";
  return "Kritisk";
};

/**
 * Get risk level color as RGB tuple
 */
export const getRiskLevelColor = (value: number): [number, number, number] => {
  if (value <= 4) return [34, 197, 94]; // green
  if (value <= 9) return [234, 179, 8]; // yellow
  if (value <= 15) return [249, 115, 22]; // orange
  return [239, 68, 68]; // red
};

/**
 * Get status label from status value
 */
const getStatusLabel = (status: unknown): string => {
  const s = safeString(status).toLowerCase();
  if (s === "fullført" || s === "completed") return "Fullført";
  if (s === "pågår" || s === "in_progress" || s === "in-progress") return "Pågår";
  return "Ikke startet";
};

/**
 * Sanitize company info
 */
export const sanitizeCompanyInfo = (data: unknown): SanitizedCompanyInfo => {
  const obj = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  return {
    id: safeString(obj.id, crypto.randomUUID()),
    name: safeString(obj.name, "Bedriftsnavn"),
    org_number: safeString(obj.org_number),
    address: safeString(obj.address),
    postal_code: safeString(obj.postal_code),
    city: safeString(obj.city),
    phone: safeString(obj.phone),
    email: safeString(obj.email),
    logo_url: obj.logo_url ? safeString(obj.logo_url) : null,
  };
};

/**
 * Sanitize goals array
 */
export const sanitizeGoals = (data: unknown): SanitizedGoal[] => {
  const arr = safeArray(data);
  return arr.map((item: unknown) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: safeString(obj.id, crypto.randomUUID()),
      goal_text: safeString(obj.goal_text),
      is_predefined: Boolean(obj.is_predefined),
    };
  }).filter(g => g.goal_text.trim() !== "");
};

/**
 * Sanitize organization data
 */
export const sanitizeOrganization = (data: unknown): SanitizedOrganization => {
  const obj = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const roles = safeArray(obj.roles);
  
  return {
    description: safeString(obj.description),
    roles: roles.map((item: unknown) => {
      const role = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return {
        id: safeString(role.id, crypto.randomUUID()),
        title: safeString(role.title),
        personName: safeString(role.personName),
        description: safeString(role.description),
        sortOrder: safeNumber(role.sortOrder, 0),
      };
    }),
  };
};

/**
 * Sanitize risk assessment data
 */
export const sanitizeRisks = (data: unknown): SanitizedRisk[] => {
  const obj = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const risks = safeArray(obj.risks || data);
  
  return risks.map((item: unknown) => {
    const risk = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const probability = safeNumber(risk.probability, 1);
    const consequence = safeNumber(risk.consequence, 1);
    const riskValue = probability * consequence;
    
    return {
      id: safeString(risk.id, crypto.randomUUID()),
      description: safeString(risk.description),
      probability,
      consequence,
      riskValue,
      riskLevel: getRiskLevelText(riskValue),
      existing_measures: safeString(risk.existing_measures),
      planned_measures: safeString(risk.planned_measures),
    };
  });
};

/**
 * Sanitize action plan data
 */
export const sanitizeActions = (data: unknown): SanitizedAction[] => {
  const obj = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const actions = safeArray(obj.actions || data);
  
  return actions.map((item: unknown) => {
    const action = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const status = safeString(action.status, "ikke_startet");
    
    return {
      id: safeString(action.id, crypto.randomUUID()),
      risk_id: safeString(action.risk_id),
      risk_description: safeString(action.risk_description),
      action_description: safeString(action.action_description),
      responsible: safeString(action.responsible, "-"),
      deadline: safeString(action.deadline, "-"),
      status,
      statusLabel: getStatusLabel(status),
      priority: safeString(action.priority, "medium"),
      comments: safeString(action.comments),
    };
  });
};

/**
 * Sanitize routines data
 */
export const sanitizeRoutines = (data: unknown): SanitizedRoutine[] => {
  const obj = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const routines = safeArray(obj.routines || data);
  
  return routines.map((item: unknown, index: number) => {
    const routine = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const defaultNumber = `R${String(index + 1).padStart(3, "0")}`;
    
    return {
      id: safeString(routine.id, crypto.randomUUID()),
      routine_number: safeString(routine.routine_number, defaultNumber),
      routine_name: safeString(routine.routine_name || (routine as any).name, "Ukjent rutine"),
      category: safeString(routine.category, "Generelt"),
      purpose: safeString(routine.purpose || (routine as any).description),
      responsibility: safeString(routine.responsibility),
      procedure: safeString(routine.procedure),
      examples: safeString(routine.examples),
      remember: safeString(routine.remember),
      is_predefined: Boolean(routine.is_predefined),
    };
  });
};

/**
 * Sanitize laws data
 */
export const sanitizeLaws = (data: unknown): SanitizedLaw[] => {
  const arr = safeArray(data);
  
  return arr.map((item: unknown) => {
    const law = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: safeString(law.id, crypto.randomUUID()),
      law_name: safeString(law.law_name),
      category: safeString(law.category, "Generelt"),
      description: safeString(law.description),
      link: safeString(law.link),
    };
  }).filter(l => l.law_name.trim() !== "");
};

/**
 * Sanitize all handbook data at once
 */
export const sanitizeHandbookData = (data: {
  companyInfo?: unknown;
  goals?: unknown;
  organization?: unknown;
  riskAssessment?: unknown;
  actionPlan?: unknown;
  routines?: unknown;
  laws?: unknown;
}): SanitizedHandbookData => {
  return {
    companyInfo: sanitizeCompanyInfo(data.companyInfo),
    goals: sanitizeGoals(data.goals),
    organization: sanitizeOrganization(data.organization),
    risks: sanitizeRisks(data.riskAssessment),
    actions: sanitizeActions(data.actionPlan),
    routines: sanitizeRoutines(data.routines),
    laws: sanitizeLaws(data.laws),
  };
};

/**
 * Format date for PDF display
 */
export const formatDateForPdf = (date: Date): string => {
  try {
    return date.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("nb-NO");
  }
};

/**
 * Load image as base64 for PDF embedding
 */
export const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    const timeout = setTimeout(() => {
      console.warn("Image load timeout:", url);
      resolve(null);
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn("Image to base64 failed:", e);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn("Image load error:", url);
      resolve(null);
    };
    
    img.src = url;
  });
};
