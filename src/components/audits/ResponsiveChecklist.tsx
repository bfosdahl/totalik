import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileChecklistItem from "./MobileChecklistItem";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

type YesNoNa = "yes" | "no" | "na" | "";

export interface ChecklistRow {
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
  // Optional editing props
  onAddItem?: (label: string) => void;
  onEditItem?: (itemId: string, newLabel: string) => void;
  onDeleteItem?: (itemId: string) => void;
}

const ResponsiveChecklist: React.FC<ResponsiveChecklistProps> = ({
  title,
  items,
  answers,
  sectionKey,
  onAnswerChange,
  onCommentChange,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  const isMobile = useIsMobile();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const isEditable = onAddItem && onEditItem && onDeleteItem;

  const handleAddItem = () => {
    if (newItemLabel.trim() && onAddItem) {
      onAddItem(newItemLabel.trim());
      setNewItemLabel('');
      setIsAddingNew(false);
    }
  };

  const handleStartEdit = (item: ChecklistRow) => {
    setEditingId(item.id);
    setEditingText(item.label);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim() && onEditItem) {
      onEditItem(editingId, editingText.trim());
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {isEditable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Legg til</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile: Stacked cards
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id}>
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    {isEditable && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(item)}
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onDeleteItem?.(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                    <MobileChecklistItem
                      label={`${index + 1}. ${item.label}`}
                      answer={answers[item.id]?.answer || ""}
                      comment={answers[item.id]?.comment || ""}
                      onAnswerChange={(value) => onAnswerChange(item.id, value)}
                      onCommentChange={(value) => onCommentChange(item.id, value)}
                      name={`${sectionKey}-${item.id}`}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {/* Add new item form - Mobile */}
            {isAddingNew && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Input
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="Skriv inn nytt spørsmål..."
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                    if (e.key === 'Escape') {
                      setIsAddingNew(false);
                      setNewItemLabel('');
                    }
                  }}
                />
                <Button type="button" variant="default" size="icon" onClick={handleAddItem}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewItemLabel('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {items.length === 0 && !isAddingNew && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen spørsmål lagt til ennå. Klikk "Legg til" for å legge til et spørsmål.
              </p>
            )}
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
                  {isEditable && (
                    <th className="text-center py-2 px-2 text-sm font-medium text-muted-foreground w-20">
                      Handlinger
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-3 text-sm">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={handleSaveEdit}>
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={handleCancelEdit}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        `${index + 1}. ${item.label}`
                      )}
                    </td>
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
                    {isEditable && editingId !== item.id && (
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onDeleteItem?.(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                    {isEditable && editingId === item.id && (
                      <td></td>
                    )}
                  </tr>
                ))}
                
                {/* Add new item row */}
                {isAddingNew && (
                  <tr className="border-t border-dashed border-border">
                    <td colSpan={isEditable ? 6 : 5} className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newItemLabel}
                          onChange={(e) => setNewItemLabel(e.target.value)}
                          placeholder="Skriv inn nytt spørsmål..."
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddItem();
                            if (e.key === 'Escape') {
                              setIsAddingNew(false);
                              setNewItemLabel('');
                            }
                          }}
                        />
                        <Button type="button" variant="default" size="icon" onClick={handleAddItem}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setIsAddingNew(false);
                            setNewItemLabel('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {items.length === 0 && !isAddingNew && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen spørsmål lagt til ennå. Klikk "Legg til" for å legge til et spørsmål.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponsiveChecklist;
