import { useState } from "react";
import type { ModuleOrderConfig } from "@/components/modules/UniversalOrderDialog";
import { t } from "@/i18n/t";

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
      t("auto.ai_assistert_oppsett_og_raadgivning"),
      t("auto.risikovurdering_og_handlingsplaner"),
      t("auto.avvikshaandtering_og_oppfoelging"),
      t("auto.automatiske_paaminnelser_og_varsler"),
      "Ubegrenset antall brukere",
    ],
  },
  IK_MAT: {
    moduleType: "IK_MAT",
    moduleName: "IK/MAT Internkontroll",
    description: t("auto.internkontroll_for_mattrygghet_og_haccp"),
    price: 3990,
    priceType: "yearly",
    bindingPeriodMonths: 12,
    cancellationNoticeMonths: 6,
    features: [
      "HACCP-system tilpasset din virksomhet",
      t("auto.temperaturlogging_og_sjekklister"),
      t("auto.leverandoeroversikt_og_sporbarhet"),
      t("auto.allergen_og_ingredienshaandtering"),
      t("auto.automatiske_varsler_ved_avvik"),
      "Ubegrenset antall brukere",
    ],
  },
  IK_BYGG: {
    moduleType: "IK_BYGG",
    moduleName: "KS Bygg",
    description: t("auto.kvalitetssikring_for_byggebransjen"),
    price: 4990,
    priceType: "yearly",
    bindingPeriodMonths: 12,
    cancellationNoticeMonths: 6,
    features: [
      t("auto.prosjektstyring_og_dokumentasjon"),
      t("auto.sjekklister_og_egenkontroller"),
      "Avvikshåndtering og HMS",
      t("auto.underleverandoerhaandtering"),
      "SHA-plan og SJA",
      "Ubegrenset antall prosjekter",
    ],
  },
  GDPR: {
    moduleType: "GDPR",
    moduleName: "GDPR",
    description: t("auto.personvern_og_gdpr_dokumentasjon"),
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
    description: t("auto.dokumentasjon_for_aapenhetsloven"),
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
    description: t("auto.internkontroll_for_alkoholomsetning"),
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
      t("auto.samlet_oversikt_for_ledelsen"),
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
