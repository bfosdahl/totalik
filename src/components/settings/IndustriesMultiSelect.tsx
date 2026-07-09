import { INDUSTRIES } from "@/lib/industries";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
}

export function IndustriesMultiSelect({ value, onChange }: Props) {
  const toggle = (key: string) => {
    if (value.includes(key)) onChange(value.filter((k) => k !== key));
    else onChange([...value, key]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {INDUSTRIES.filter((i) => !["hms_generelt", "ks_generelt"].includes(i.key)).map((ind) => {
        const active = value.includes(ind.key);
        return (
          <button
            type="button"
            key={ind.key}
            onClick={() => toggle(ind.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-border"
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {ind.label}
          </button>
        );
      })}
    </div>
  );
}
