// Norwegian food safety temperature guidelines (Mattilsynet Trafikklys)
// Traffic light system for temperature deviation handling

export type TrafficLightStatus = 'green' | 'yellow' | 'red';

export interface TemperatureGuideline {
  status: TrafficLightStatus;
  message: string;
  action: string;
}

// Equipment type definitions with Norwegian labels and default ranges
export const EQUIPMENT_TYPE_DEFAULTS = {
  fridge: { min: 0, max: 4, label: 'Kjøleskap' },
  freezer: { min: -25, max: -18, label: 'Fryser' },
  hot_display: { min: 60, max: 100, label: 'Varmebuffet' },
  cold_display: { min: 0, max: 8, label: 'Kjøledisk' },
  hot_holding: { min: 60, max: 100, label: 'Varmholding' },
  heat_treatment: { min: 75, max: 100, label: 'Varmebehandling' },
};

// Refrigeration unit (Kjøleenheter) guidelines
export function getRefrigerationGuideline(temp: number): TemperatureGuideline {
  if (temp >= 12) {
    return {
      status: 'red',
      message: '12°C eller varmere - Kritisk!',
      action: 'Produktene kastes. Reparatør tilkalles.',
    };
  }
  if (temp >= 8) {
    return {
      status: 'yellow',
      message: '8-11°C - Avvik',
      action: 'Varene flyttes til annen kjøleenhet med riktig temperatur og tilvirkes til varmmat samme dag, eller kastes! Må merkes. Reparatør tilkalles.',
    };
  }
  if (temp >= 5) {
    return {
      status: 'yellow',
      message: '5-7°C - Avvik',
      action: 'Varene flyttes til annen kjøleenhet med riktig temperatur. Mål temperaturen etter 2 timer. Hvis fortsatt 5°C flyttes varene til annen kjøleenhet.',
    };
  }
  return {
    status: 'green',
    message: '-1 til 4°C - Riktig temperatur',
    action: 'Aksepter. Ingen tiltak nødvendig.',
  };
}

// Freezer unit (Fryseenheter) guidelines
export function getFreezerGuideline(temp: number): TemperatureGuideline {
  if (temp >= -10) {
    return {
      status: 'red',
      message: '-10 til -5°C eller varmere - Kritisk!',
      action: 'Produktene kan brukes samme dag, resten kastes. Reparatør tilkalles.',
    };
  }
  if (temp >= -15) {
    return {
      status: 'yellow',
      message: '-11 til -15°C - Avvik',
      action: 'Produktene omplasseres til annen fryseenhet. Temperaturen måles hver time. Tilkall reparatør.',
    };
  }
  if (temp > -18) {
    return {
      status: 'yellow',
      message: '-16 til -17°C - Avvik',
      action: 'Mål temperaturen hver time inntil temperaturen er -18°C. Tilkall reparatør hvis dette ikke skjer.',
    };
  }
  return {
    status: 'green',
    message: '-18°C eller kaldere - Riktig temperatur',
    action: 'Aksepter. Varer skal være merket "Best før..."',
  };
}

// Hot holding (Varmholding) guidelines
export function getHotHoldingGuideline(temp: number): TemperatureGuideline {
  if (temp < 48) {
    return {
      status: 'red',
      message: 'Under 48°C - Kritisk!',
      action: 'Produktene kastes!',
    };
  }
  if (temp < 55) {
    return {
      status: 'yellow',
      message: '48-55°C - Avvik',
      action: 'Produktene gjenoppvarmes til 75°C eller kastes. Gjenoppvarming kan kun skje én gang. Temperaturen justeres. Kontroller temperaturen etter ca. 1 time.',
    };
  }
  if (temp >= 60) {
    return {
      status: 'green',
      message: '60°C eller høyere - Riktig temperatur',
      action: 'Kjernetemperaturen i produktene skal være ≥60°C. Alle produkter skal være oppvarmet til riktig temperatur før varmholding.',
    };
  }
  // 55-59°C - borderline
  return {
    status: 'yellow',
    message: '55-59°C - Grenseverdi',
    action: 'Temperaturen bør økes til minst 60°C. Kontroller temperaturen etter ca. 1 time.',
  };
}

// Heat treatment (Varmebehandling) guidelines
export function getHeatTreatmentGuideline(temp: number): TemperatureGuideline {
  if (temp < 70) {
    return {
      status: 'red',
      message: 'Under 70°C - Kritisk!',
      action: 'Varmes opp til 75°C (kun én gang) eller kastes!',
    };
  }
  if (temp < 72) {
    return {
      status: 'yellow',
      message: '70-72°C - Grenseverdi',
      action: 'Temperaturen kan være ≥72°C i minimum 15 sek. eller >70°C i 2 min. Alternativt varmes til 75°C.',
    };
  }
  if (temp >= 75) {
    return {
      status: 'green',
      message: '75°C eller høyere - Riktig temperatur',
      action: 'Kjernetemperaturen i produktet skal være ≥75°C. Aksepter.',
    };
  }
  // 72-74°C
  return {
    status: 'yellow',
    message: '72-74°C - Akseptabelt med betingelser',
    action: 'Temperaturen kan være ≥72°C i minimum 15 sek. Anbefalt: varm til 75°C for sikkerhet.',
  };
}

// Hot display (Varmebuffet) - same as hot holding
export function getHotDisplayGuideline(temp: number): TemperatureGuideline {
  return getHotHoldingGuideline(temp);
}

// Cold display (Kjøledisk) guidelines
export function getColdDisplayGuideline(temp: number): TemperatureGuideline {
  if (temp > 8) {
    return {
      status: 'red',
      message: 'Over 8°C - Kritisk!',
      action: 'Produktene flyttes til kjøl eller kastes. Kontroller enhet.',
    };
  }
  if (temp > 4) {
    return {
      status: 'yellow',
      message: '5-8°C - Avvik',
      action: 'Produktene bør brukes snart eller flyttes til kjøl. Kontroller temperaturen etter 1 time.',
    };
  }
  return {
    status: 'green',
    message: '0-4°C - Riktig temperatur',
    action: 'Aksepter. Ingen tiltak nødvendig.',
  };
}

// Main function to get guideline based on equipment type
export function getTemperatureGuideline(
  equipmentType: string,
  temperature: number
): TemperatureGuideline {
  switch (equipmentType) {
    case 'fridge':
      return getRefrigerationGuideline(temperature);
    case 'freezer':
      return getFreezerGuideline(temperature);
    case 'hot_holding':
      return getHotHoldingGuideline(temperature);
    case 'heat_treatment':
      return getHeatTreatmentGuideline(temperature);
    case 'hot_display':
      return getHotDisplayGuideline(temperature);
    case 'cold_display':
      return getColdDisplayGuideline(temperature);
    default:
      // Generic check based on min/max
      return {
        status: 'green',
        message: 'Temperatur registrert',
        action: 'Kontroller mot akseptable grenser.',
      };
  }
}

// Status colors for UI
export function getStatusColor(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
  }
}

export function getStatusBgClass(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
      return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800';
    case 'yellow':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800';
    case 'red':
      return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
  }
}

export function getStatusTextClass(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
      return 'text-green-700 dark:text-green-400';
    case 'yellow':
      return 'text-yellow-700 dark:text-yellow-400';
    case 'red':
      return 'text-red-700 dark:text-red-400';
  }
}
