import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  Bell, 
  Shield, 
  Palette,
  Database,
  ChevronRight
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { CompanyInfoSettings } from "@/components/settings/CompanyInfoSettings";

type SettingsSection = "main" | "company" | "users" | "notifications" | "security" | "customization" | "data";

const settingsSections = [
  {
    id: "company" as const,
    icon: Building2,
    title: "Bedriftsinformasjon",
    description: "Administrer bedriftsdetaljer og kontaktinfo",
    implemented: true,
  },
  {
    id: "users" as const,
    icon: Users,
    title: "Brukere og tilgang",
    description: "Administrer brukere og tilgangsrettigheter",
    implemented: false,
  },
  {
    id: "notifications" as const,
    icon: Bell,
    title: "Varsler",
    description: "Konfigurer e-postvarsler og påminnelser",
    implemented: false,
  },
  {
    id: "security" as const,
    icon: Shield,
    title: "Sikkerhet",
    description: "Passord, tofaktorautentisering og sikkerhetspolicyer",
    implemented: false,
  },
  {
    id: "customization" as const,
    icon: Palette,
    title: "Tilpasning",
    description: "Logo, farger og utseende",
    implemented: false,
  },
  {
    id: "data" as const,
    icon: Database,
    title: "Data og eksport",
    description: "Sikkerhetskopi og dataeksport",
    implemented: false,
  },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");

  const handleSectionClick = (section: typeof settingsSections[0]) => {
    if (section.implemented) {
      setActiveSection(section.id);
    } else {
      toast.info(`${section.title} kommer snart!`);
    }
  };

  // Render sub-section
  if (activeSection === "company") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <CompanyInfoSettings onBack={() => setActiveSection("main")} />
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
          <h1 className="text-2xl font-bold tracking-tight">Innstillinger</h1>
          <p className="text-muted-foreground">
            Administrer systeminnstillinger og preferanser
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
                onClick={() => handleSectionClick(section)}
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

        {/* Quick info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <h3 className="font-semibold mb-4">Kontoinformasjon</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Abonnement</span>
              <span className="font-medium">Premium</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Brukere</span>
              <span className="font-medium">5 / 10</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Lagring brukt</span>
              <span className="font-medium">2.3 GB / 10 GB</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Fornyes</span>
              <span className="font-medium">15. februar 2024</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;