import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-card">
      <p className="text-sm font-medium leading-relaxed">{label}</p>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={answer === "yes"}
            onChange={() => onAnswerChange("yes")}
            className="w-5 h-5 text-primary border-border focus:ring-primary"
          />
          <span className={cn(
            "text-sm font-medium",
            answer === "yes" && "text-green-600"
          )}>Ja</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={answer === "no"}
            onChange={() => onAnswerChange("no")}
            className="w-5 h-5 text-primary border-border focus:ring-primary"
          />
          <span className={cn(
            "text-sm font-medium",
            answer === "no" && "text-red-600"
          )}>Nei</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={answer === "na"}
            onChange={() => onAnswerChange("na")}
            className="w-5 h-5 text-primary border-border focus:ring-primary"
          />
          <span className={cn(
            "text-sm font-medium",
            answer === "na" && "text-muted-foreground"
          )}>N/A</span>
        </label>
      </div>
      
      <Input
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Kommentar..."
        className="h-9 text-sm"
      />
    </div>
  );
};

export default MobileChecklistItem;
