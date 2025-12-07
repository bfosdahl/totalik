import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, X, Minus, MessageSquare } from "lucide-react";

type YesNoNa = "yes" | "no" | "na" | "";

interface MobileChecklistItemProps {
  label: string;
  answer: YesNoNa;
  comment: string;
  onAnswerChange: (value: YesNoNa) => void;
  onCommentChange: (value: string) => void;
  name: string;
}

const MobileChecklistItem: React.FC<MobileChecklistItemProps> = ({
  label,
  answer,
  comment,
  onAnswerChange,
  onCommentChange,
  name,
}) => {
  const [showComment, setShowComment] = React.useState(!!comment);

  return (
    <div className="border border-border rounded-xl p-4 space-y-4 bg-card shadow-sm">
      <p className="text-sm font-medium leading-relaxed pr-2">{label}</p>
      
      {/* Large touch-friendly answer buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onAnswerChange("yes")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all duration-200 active:scale-95",
            answer === "yes"
              ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400"
              : "bg-background border-border text-muted-foreground hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10"
          )}
        >
          <Check className={cn("h-6 w-6", answer === "yes" && "text-green-600 dark:text-green-400")} />
          <span className="text-sm font-medium">Ja</span>
        </button>
        
        <button
          type="button"
          onClick={() => onAnswerChange("no")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all duration-200 active:scale-95",
            answer === "no"
              ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-400"
              : "bg-background border-border text-muted-foreground hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
          )}
        >
          <X className={cn("h-6 w-6", answer === "no" && "text-red-600 dark:text-red-400")} />
          <span className="text-sm font-medium">Nei</span>
        </button>
        
        <button
          type="button"
          onClick={() => onAnswerChange("na")}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all duration-200 active:scale-95",
            answer === "na"
              ? "bg-muted border-muted-foreground/50 text-foreground"
              : "bg-background border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
          )}
        >
          <Minus className={cn("h-6 w-6", answer === "na" && "text-muted-foreground")} />
          <span className="text-sm font-medium">N/A</span>
        </button>
      </div>

      {/* Comment toggle and input */}
      {!showComment ? (
        <button
          type="button"
          onClick={() => setShowComment(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Legg til kommentar</span>
        </button>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Kommentar</label>
          <Input
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Skriv kommentar..."
            className="h-12 text-base"
          />
        </div>
      )}
    </div>
  );
};

export default MobileChecklistItem;
