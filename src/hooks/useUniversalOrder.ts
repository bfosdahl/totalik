import { useState } from "react";
import type { ModuleOrderConfig } from "@/components/modules/UniversalOrderDialog";

// Predefined module configurations
export const MODULE_CONFIGS: Record<string, ModuleOrderConfig> = {
  IK_HMS: {
    moduleType: "IK_HMS",
    moduleName: "IK/HMS Internkontrollsystem",
    description: "Komplett HMS-system tilpasset din bedrift",
    price: 3990,
    priceType: "yearly",
    bindingPeriodMonths: 12,
    cancellationNoticeMonths: 6,
    features: [
      "Komplett HMS-system tilpasset din bedrift",
      "AI-assistert oppsett og rådgivning",
      "Risikovurdering og handlingsplaner",
      "Avvikshåndtering og oppfølging",
      "Automatiske påminnelser og varsler",
      "Ubegrenset antall brukere",
    ],
  },
  IK_MAT: {
    moduleType: "IK_MAT",
    moduleName: "IK/MAT Internkontroll",
    description: "Internkontroll for mattrygghet og HACCP",
    price: 3990,
    priceType: "yearly",
    bindingPeriodMonths: 12,
    cancellationNoticeMonths: 6,
    features: [
      "HACCP-system tilpasset din virksomhet",
      "Temperaturlogging og sjekklister",
      "Leverandøroversikt og sporbarhet",
      "Allergen- og ingredienshåndtering",
      "Automatiske varsler ved avvik",
      "Ubegrenset antall brukere",
    ],
  },
  IK_BYGG: {
    moduleType: "IK_BYGG",
    moduleName: "KS Bygg",
    description: "Kvalitetssikring for byggebransjen",
    price: 4990,
    priceType: "yearly",
    bindingPeriodMonths: 12,
    cancellationNoticeMonths: 6,
    features: [
      "Prosjektstyring og dokumentasjon",
      "Sjekklister og egenkontroller",
      "Avvikshåndtering og HMS",
      "Underleverandørhåndtering",
      "SHA-plan og SJA",
      "Ubegrenset antall prosjekter",
    ],
  },
  GDPR: {
    moduleType: "GDPR",
    moduleName: "GDPR",
    description: "Personvern og GDPR-dokumentasjon",
    price: 299,
    priceType: "monthly",
    features: [
      "Behandlingsprotokoll",
      "Personvernerklæringer",
      "Databehandleravtaler",
      "Risikovurdering personvern",
    ],
  },
  APENHETSLOVEN: {
    moduleType: "APENHETSLOVEN",
    moduleName: "Åpenhetsloven",
    description: "Dokumentasjon for åpenhetsloven",
    price: 299,
    priceType: "monthly",
    features: [
      "Aktsomhetsvurderinger",
      "Leverandørkartlegging",
      "Risikoanalyse",
      "Rapportering",
    ],
  },
  IK_ALKOHOL: {
    moduleType: "IK_ALKOHOL",
    moduleName: "IK/Alkohol",
    description: "Internkontroll for alkoholomsetning",
    price: 299,
    priceType: "monthly",
    features: [
      "Alderskontroll-rutiner",
      "Opplæringsdokumentasjon",
      "Kontrollskjemaer",
      "Avvikshåndtering",
    ],
  },
  PERSONALHANDBOK: {
    moduleType: "PERSONALHANDBOK",
    moduleName: "Personalhåndbok",
    description: "Digital personalhåndbok",
    price: 299,
    priceType: "monthly",
    features: [
      "Ferdig oppsett med maler",
      "Tilpassbare rutiner",
      "Ansattilgang",
      "Versjonshåndtering",
    ],
  },
  AVDELINGER: {
    moduleType: "AVDELINGER",
    moduleName: "Avdelinger",
    description: "Organiser bedriften i avdelinger",
    price: 199,
    priceType: "monthly",
    features: [
      "Flere avdelinger/lokasjoner",
      "Avdelingsvis tilgangsstyring",
      "Separate dashboards",
      "Samlet oversikt for ledelsen",
    ],
  },
};

export function useUniversalOrder() {
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ModuleOrderConfig | null>(null);

  const openOrderDialog = (moduleType: string, customConfig?: Partial<ModuleOrderConfig>) => {
    const baseConfig = MODULE_CONFIGS[moduleType];
    if (!baseConfig && !customConfig) {
      console.error(`No config found for module type: ${moduleType}`);
      return;
    }

    const config = customConfig 
      ? { ...baseConfig, ...customConfig, moduleType } as ModuleOrderConfig
      : baseConfig;

    setCurrentConfig(config);
    setOrderDialogOpen(true);
  };

  const closeOrderDialog = () => {
    setOrderDialogOpen(false);
    setCurrentConfig(null);
  };

  return {
    orderDialogOpen,
    setOrderDialogOpen,
    currentConfig,
    openOrderDialog,
    closeOrderDialog,
  };
}
