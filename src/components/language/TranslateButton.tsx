import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, Loader2, Check } from "lucide-react";
import { useLanguage, LANGUAGE_CONFIG, SupportedLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TranslateButtonProps {
  content: string;
  onTranslated: (translatedContent: string) => void;
  contentType?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function TranslateButton({
  content,
  onTranslated,
  contentType = "handbook",
  className,
  size = "sm",
}: TranslateButtonProps) {
  const { language } = useLanguage();
  const { translateContent, isTranslating } = useTranslation();
  const [translatedTo, setTranslatedTo] = useState<SupportedLanguage | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleTranslate = async (targetLang: SupportedLanguage) => {
    if (targetLang === "no") {
      onTranslated(content);
      setTranslatedTo(null);
      setIsOpen(false);
      return;
    }

    const translated = await translateContent(content, targetLang, contentType);
    onTranslated(translated);
    setTranslatedTo(targetLang);
    setIsOpen(false);
  };

  const currentLangName = translatedTo 
    ? LANGUAGE_CONFIG[translatedTo].nativeName 
    : LANGUAGE_CONFIG[language].nativeName;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn("gap-2", className)}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isTranslating ? "Oversetter..." : translatedTo ? currentLangName : "Oversett"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 pb-2">Velg språk</p>
          {(Object.keys(LANGUAGE_CONFIG) as SupportedLanguage[]).map((lang) => {
            const config = LANGUAGE_CONFIG[lang];
            const isActive = translatedTo === lang || (!translatedTo && lang === "no");

            return (
              <button
                key={lang}
                onClick={() => handleTranslate(lang)}
                disabled={isTranslating}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-muted",
                  isActive && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.flag}</span>
                  <span>{config.nativeName}</span>
                </div>
                {isActive && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
