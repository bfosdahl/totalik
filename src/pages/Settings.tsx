import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  Bell, 
  Shield, 
  Palette,
  Database,
  ChevronRight,
  LucideIcon,
  Download,
  Smartphone,
  Layers,
  Wallet,
  Trash2
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { CompanyInfoSettings } from "@/components/settings/CompanyInfoSettings";
import { UserManagementSettings } from "@/components/settings/UserManagementSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { CustomizationSettings } from "@/components/settings/CustomizationSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { DepartmentSettings } from "@/components/settings/DepartmentSettings";
import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";
import { AllowanceTypesSettings } from "@/components/settings/AllowanceTypesSettings";
import { CompanyTrashBinSettings } from "@/components/settings/CompanyTrashBinSettings";
import { DataExportSettings } from "@/components/settings/DataExportSettings";
import { t } from "@/i18n/t";

type SettingsSection = "main" | "company" | "users" | "departments" | "notifications" | "security" | "customization" | "data" | "allowances" | "trash";

interface SettingsSectionConfig {
  id: SettingsSection;
  icon: LucideIcon;
  title: string;
  description: string;
}

const settingsSections: SettingsSectionConfig[] = [
  {
    id: "company",
    icon: Building2,
    title: t("auto.bedriftsinformasjon"),
    description: t("auto.administrer_bedriftsdetaljer_og_kontakti"),
  },
  {
    id: "users",
    icon: Users,
    title: t("auto.brukere_og_tilgang"),
    description: t("auto.administrer_brukere_og_tilgangsrettighet"),
  },
  {
    id: "departments",
    icon: Layers,
    title: t("auto.avdelinger"),
    description: t("auto.organiser_bedriften_i_avdelinger"),
  },
  {
    id: "allowances",
    icon: Wallet,
    title: t("auto.loenn_tilleggssatser"),
    description: t("auto.definer_satser_for_diett_kilometer_reise"),
  },
  {
    id: "notifications",
    icon: Bell,
    title: t("auto.varsler"),
    description: t("auto.konfigurer_e_postvarsler_og_paaminnelser"),
  },
  {
    id: "security",
    icon: Shield,
    title: t("auto.sikkerhet"),
    description: t("auto.passord_tofaktorautentisering_og_sikkerh"),
  },
  {
    id: "customization",
    icon: Palette,
    title: t("auto.tilpasning"),
    description: t("auto.logo_farger_og_utseende"),
  },
  {
    id: "data",
    icon: Database,
    title: t("auto.data_og_eksport"),
    description: t("auto.last_ned_full_kopi_av_bedriftens_data_gd"),
  },
  {
    id: "trash",
    icon: Trash2,
    title: t("auto.papirkurv"),
    description: "Gjenopprett slettet innhold (90 dager)",
  },
];

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");
  const navigate = useNavigate();

  // Handle URL params for direct navigation (e.g., /settings?tab=company&create=true)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && settingsSections.some(s => s.id === tab)) {
      setActiveSection(tab as SettingsSection);
    }
  }, [searchParams]);

  const goBack = () => {
    setActiveSection("main");
    setSearchParams({});
  };

  // Get current section config
  const currentSection = settingsSections.find(s => s.id === activeSection);
  const createMode = searchParams.get("create") === "true";

  // Render sub-sections
  if (activeSection === "company") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <CompanyInfoSettings onBack={goBack} createMode={createMode} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "users") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <UserManagementSettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "notifications") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <NotificationSettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "customization") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <CustomizationSettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "security") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <SecuritySettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "departments") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <DepartmentSettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "allowances") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <AllowanceTypesSettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "trash") {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <CompanyTrashBinSettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === "data") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <DataExportSettings onBack={goBack} />
        </div>
      </AppLayout>
    );
  }

  // Render placeholder for other sections
  if (activeSection !== "main" && currentSection) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <SettingsPlaceholder
            title={currentSection.title}
            description={currentSection.description}
            icon={currentSection.icon}
            onBack={goBack}
          />
        </div>
      </AppLayout>
    );
  }

  // Main settings menu
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-bold tracking-tight">{t("auto.innstillinger")}</h1>
          <p className="text-muted-foreground">
            {t("auto.administrer_systeminnstillinger_og_prefe")}
          </p>
        </motion.div>

        {/* Settings grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        >
          <div className="divide-y divide-border">
            {settingsSections.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="flex items-center gap-4 p-5 hover:bg-secondary/50 transition-colors group w-full text-left"
              >
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Mobile App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6 shadow-card"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">{t("auto.last_ned_mobilapp")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("auto.installer_athena_hms_paa_mobilen_din_for")}
              </p>
              <Button onClick={() => navigate("/install")} className="gap-2">
                <Download className="w-4 h-4" />
                Last ned app
              </Button>
            </div>
          </div>
        </motion.div>

      </div>
    </AppLayout>
  );
};

export default Settings;