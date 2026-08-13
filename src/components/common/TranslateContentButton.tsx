import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, Loader2, Undo2 } from "lucide-react";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { useTranslate } from "@/hooks/useTranslate";
import { toast } from "sonner";

interface TranslateContentButtonProps {
  /** Original texts stored in the database */
  texts: string[];
  /** Called with translated texts, or with the originals when toggled back */
  onResult: (texts: string[] | null) => void;
  contentType?: string;
  size?: "sm" | "default";
  className?: string;
}

/**
 * Small toggle button that translates database content into the reader's language.
 * If the content is already written in that language, nothing changes.
 */
export function TranslateContentButton({
  texts,
  onResult,
  contentType = "db-content",
  size = "sm",
  className,
}: TranslateContentButtonProps) {
  const { t } = useTranslate();
  const { translateMany, isTranslating } = useContentTranslation(contentType);
  const [showingTranslation, setShowingTranslation] = useState(false);

  const handleClick = async () => {
    if (showingTranslation) {
      setShowingTranslation(false);
      onResult(null);
      return;
    }
    const result = await translateMany(texts);
    const changed = result.some((r, i) => r !== texts[i]);
    if (!changed) {
      toast.info(t("common.alreadyInYourLanguage", "Innholdet er allerede på ditt språk"));
      return;
    }
    onResult(result);
    setShowingTranslation(true);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isTranslating}
    >
      {isTranslating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showingTranslation ? (
        <Undo2 className="h-4 w-4" />
      ) : (
        <Languages className="h-4 w-4" />
      )}
      <span className="ml-2">
        {showingTranslation
          ? t("common.showOriginal", "Vis original")
          : t("common.translate", "Oversett")}
      </span>
    </Button>
  );
}
