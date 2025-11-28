import React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileChecklistItem from "./MobileChecklistItem";

type YesNoNa = "yes" | "no" | "na" | "";

interface ChecklistRow {
  id: string;
  label: string;
}

interface ChecklistAnswers {
  [key: string]: {
    answer: YesNoNa;
    comment: string;
  };
}

interface ResponsiveChecklistProps {
  title: string;
  items: ChecklistRow[];
  answers: ChecklistAnswers;
  sectionKey: string;
  onAnswerChange: (itemId: string, value: YesNoNa) => void;
  onCommentChange: (itemId: string, value: string) => void;
}

const ResponsiveChecklist: React.FC<ResponsiveChecklistProps> = ({
  title,
  items,
  answers,
  sectionKey,
  onAnswerChange,
  onCommentChange,
}) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile: Stacked cards
          <div className="space-y-3">
            {items.map((item) => (
              <MobileChecklistItem
                key={item.id}
                label={item.label}
                answer={answers[item.id]?.answer || ""}
                comment={answers[item.id]?.comment || ""}
                onAnswerChange={(value) => onAnswerChange(item.id, value)}
                onCommentChange={(value) => onCommentChange(item.id, value)}
                name={`${sectionKey}-${item.id}`}
              />
            ))}
          </div>
        ) : (
          // Desktop: Table view
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                    Kontrollpunkt
                  </th>
                  <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground w-14">
                    Ja
                  </th>
                  <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground w-14">
                    Nei
                  </th>
                  <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground w-14">
                    N/A
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-48">
                    Kommentar
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-3 text-sm">{item.label}</td>
                    <td className="text-center py-3 px-2">
                      <input
                        type="radio"
                        name={`${sectionKey}-${item.id}`}
                        checked={answers[item.id]?.answer === "yes"}
                        onChange={() => onAnswerChange(item.id, "yes")}
                        className="w-4 h-4 text-primary border-border focus:ring-primary"
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <input
                        type="radio"
                        name={`${sectionKey}-${item.id}`}
                        checked={answers[item.id]?.answer === "no"}
                        onChange={() => onAnswerChange(item.id, "no")}
                        className="w-4 h-4 text-primary border-border focus:ring-primary"
                      />
                    </td>
                    <td className="text-center py-3 px-2">
                      <input
                        type="radio"
                        name={`${sectionKey}-${item.id}`}
                        checked={answers[item.id]?.answer === "na"}
                        onChange={() => onAnswerChange(item.id, "na")}
                        className="w-4 h-4 text-primary border-border focus:ring-primary"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        value={answers[item.id]?.comment || ""}
                        onChange={(e) => onCommentChange(item.id, e.target.value)}
                        placeholder="Kommentar..."
                        className="h-8 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponsiveChecklist;
