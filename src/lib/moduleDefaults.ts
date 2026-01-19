/**
 * Safe default settings for modules when they are first activated.
 * This prevents crashes from pages trying to access undefined nested properties.
 */

export interface IkMatSettings {
  generatedContent: {
    goals: string[];
    risks: any[];
    haccp: any[];
    routines: any[];
    cleaningPlan: any[];
    checklists: any[];
    equipment: {
      refrigerators: any[];
      freezers: any[];
    };
    organization: {
      roles: any[];
    };
    virksomhet: {
      type: string;
      antallAnsatte: number;
      beskrivelse: string;
    };
  };
  manualContent: {
    goals: any[];
    risks: any[];
    haccp: any[];
    routines: any[];
    actionPlan: any[];
    controlLogs: any[];
    organization: {
      roles: any[];
    };
  };
  setupCompletedAt?: string;
}

export interface IkHmsSettings {
  industry?: string;
  setupCompletedAt?: string;
}

export interface IkByggSettings {
  trade?: string;
  setupCompletedAt?: string;
}

/**
 * Returns safe default settings for a given module type.
 * These defaults ensure that pages don't crash when trying to access
 * nested properties before the AI setup has been run.
 */
export function getModuleDefaultSettings(moduleType: string): Record<string, any> {
  switch (moduleType) {
    case "IK_MAT":
      return {
        generatedContent: {
          goals: [],
          risks: [],
          haccp: [],
          routines: [],
          cleaningPlan: [],
          checklists: [],
          equipment: {
            refrigerators: [],
            freezers: [],
          },
          organization: {
            roles: [],
          },
          virksomhet: {
            type: "",
            antallAnsatte: 0,
            beskrivelse: "",
          },
        },
        manualContent: {
          goals: [],
          risks: [],
          haccp: [],
          routines: [],
          actionPlan: [],
          controlLogs: [],
          organization: {
            roles: [],
          },
        },
      };
    
    case "IK_HMS":
      return {
        industry: null,
      };
    
    case "IK_BYGG":
      return {
        trade: null,
      };
    
    case "IK_ALKOHOL":
      return {
        generatedContent: {
          goals: [],
          risks: [],
          routines: [],
        },
        manualContent: {},
      };
    
    case "GDPR":
    case "APENHETSLOVEN":
    case "PERSONALHANDBOK":
      return {};
    
    default:
      return {};
  }
}

/**
 * Merges user settings with safe defaults to ensure all expected properties exist.
 * Use this when reading module settings to prevent undefined access errors.
 */
export function getSafeModuleSettings<T extends Record<string, any>>(
  moduleType: string,
  settings: T | null | undefined
): T {
  const defaults = getModuleDefaultSettings(moduleType);
  
  if (!settings) {
    return defaults as T;
  }
  
  // Deep merge defaults with existing settings
  return deepMerge(defaults, settings) as T;
}

/**
 * Deep merge two objects, with source taking precedence over target.
 */
function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) {
    return target;
  }
  
  if (typeof source !== 'object' || Array.isArray(source)) {
    return source;
  }
  
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        result[key] = deepMerge(target?.[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}
