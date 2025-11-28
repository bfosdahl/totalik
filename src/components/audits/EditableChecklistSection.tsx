import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Check, 
  X,
  GripVertical
} from 'lucide-react';

type YesNoNa = 'yes' | 'no' | 'na' | '';

export interface ChecklistQuestion {
  id: string;
  question: string;
}

export interface ChecklistAnswer {
  answer: YesNoNa;
  comment: string;
}

interface EditableChecklistSectionProps {
  sectionId: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  questions: ChecklistQuestion[];
  answers: { [questionId: string]: ChecklistAnswer };
  onAnswerChange: (questionId: string, field: 'answer' | 'comment', value: string) => void;
  onAddQuestion: (question: string) => void;
  onEditQuestion: (questionId: string, newQuestion: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onTitleChange?: (newTitle: string) => void;
  onSubtitleChange?: (newSubtitle: string) => void;
  onDeleteSection?: () => void;
}

const EditableChecklistSection: React.FC<EditableChecklistSectionProps> = ({
  sectionId,
  title,
  subtitle,
  icon: SectionIcon,
  questions,
  answers,
  onAnswerChange,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onTitleChange,
  onSubtitleChange,
  onDeleteSection,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(title);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(subtitle || '');

  const handleSaveTitle = () => {
    if (editingTitle.trim() && onTitleChange) {
      onTitleChange(editingTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSaveSubtitle = () => {
    if (onSubtitleChange) {
      onSubtitleChange(editingSubtitle.trim());
    }
    setIsEditingSubtitle(false);
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      onAddQuestion(newQuestion.trim());
      setNewQuestion('');
      setIsAddingNew(false);
    }
  };

  const handleStartEdit = (question: ChecklistQuestion) => {
    setEditingId(question.id);
    setEditingText(question.question);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim()) {
      onEditQuestion(editingId, editingText.trim());
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <SectionIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="text-lg font-semibold h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                        setEditingTitle(title);
                      }
                    }}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveTitle}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setIsEditingTitle(false);
                    setEditingTitle(title);
                  }}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  {onTitleChange && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditingTitle(title);
                        setIsEditingTitle(true);
                      }}
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              )}
              {isEditingSubtitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={editingSubtitle}
                    onChange={(e) => setEditingSubtitle(e.target.value)}
                    className="text-sm h-7"
                    placeholder="Legg til beskrivelse..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSubtitle();
                      if (e.key === 'Escape') {
                        setIsEditingSubtitle(false);
                        setEditingSubtitle(subtitle || '');
                      }
                    }}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveSubtitle}>
                    <Check className="w-3 h-3 text-green-600" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    setIsEditingSubtitle(false);
                    setEditingSubtitle(subtitle || '');
                  }}>
                    <X className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ) : subtitle || onSubtitleChange ? (
                <div className="flex items-center gap-2 group">
                  <CardDescription>{subtitle || 'Klikk for å legge til beskrivelse'}</CardDescription>
                  {onSubtitleChange && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditingSubtitle(subtitle || '');
                        setIsEditingSubtitle(true);
                      }}
                    >
                      <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            {onDeleteSection && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDeleteSection}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="space-y-3 pb-4 border-b border-border last:border-0 last:pb-0">
            {editingId === q.id ? (
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
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm flex-1">{index + 1}. {q.question}</p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleStartEdit(q)}
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDeleteQuestion(q.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <RadioGroup
                value={answers[q.id]?.answer || ''}
                onValueChange={(value) => onAnswerChange(q.id, 'answer', value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id={`${sectionId}-${q.id}-yes`} />
                  <Label htmlFor={`${sectionId}-${q.id}-yes`} className="text-sm">Ja</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id={`${sectionId}-${q.id}-no`} />
                  <Label htmlFor={`${sectionId}-${q.id}-no`} className="text-sm">Nei</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="na" id={`${sectionId}-${q.id}-na`} />
                  <Label htmlFor={`${sectionId}-${q.id}-na`} className="text-sm">Ikke aktuelt</Label>
                </div>
              </RadioGroup>
              <Input
                placeholder="Kommentar"
                value={answers[q.id]?.comment || ''}
                onChange={(e) => onAnswerChange(q.id, 'comment', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        ))}

        {/* Add new question form */}
        {isAddingNew && (
          <div className="flex items-center gap-2 pt-2 border-t border-dashed border-border">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Skriv inn nytt spørsmål..."
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddQuestion();
                if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewQuestion('');
                }
              }}
            />
            <Button type="button" variant="default" size="icon" onClick={handleAddQuestion}>
              <Check className="w-4 h-4" />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setIsAddingNew(false);
                setNewQuestion('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {questions.length === 0 && !isAddingNew && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ingen spørsmål lagt til ennå. Klikk "Legg til" for å legge til et spørsmål.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EditableChecklistSection;
