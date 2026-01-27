import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, LANGUAGE_CONFIG, SupportedLanguage } from "@/contexts/LanguageContext";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "icon" | "full";
  className?: string;
}

export function LanguageSelector({ variant = "icon", className }: LanguageSelectorProps) {
  const { language, setLanguage, isChanging } = useLanguage();
  const currentLang = LANGUAGE_CONFIG[language];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          className={cn("gap-2 min-w-[40px]", className)}
          disabled={isChanging}
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="text-base leading-none">{currentLang.flag}</span>
          {variant === "full" && (
            <span className="hidden sm:inline text-sm">{currentLang.nativeName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(Object.keys(LANGUAGE_CONFIG) as SupportedLanguage[]).map((lang) => {
          const config = LANGUAGE_CONFIG[lang];
          const isActive = language === lang;

          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{config.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{config.name}</span>
                </div>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
