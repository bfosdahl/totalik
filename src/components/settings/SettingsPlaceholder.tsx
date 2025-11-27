import { motion } from "framer-motion";
import { ArrowLeft, Construction, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onBack: () => void;
}

export function SettingsPlaceholder({ 
  title, 
  description, 
  icon: Icon, 
  onBack 
}: SettingsPlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-card p-12 flex flex-col items-center justify-center text-center"
      >
        <div className="p-4 rounded-full bg-muted mb-4">
          <Construction className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Kommer snart</h2>
        <p className="text-muted-foreground max-w-md">
          Denne funksjonen er under utvikling og vil være tilgjengelig i en fremtidig oppdatering.
        </p>
      </motion.div>
    </div>
  );
}