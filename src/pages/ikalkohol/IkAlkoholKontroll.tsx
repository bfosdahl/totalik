import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ClipboardCheck, CalendarDays, CalendarClock, Scale, Plus, Trash2, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIkAlkoholControls,
  DAILY_CHECKLISTS,
  MONTHLY_CHECKLISTS,
  YEARLY_CHECKLISTS,
  type ChecklistItem,
  type ControlEntry,
} from "@/hooks/useIkAlkoholControls";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const REGELVERK = [
  { name: "Alkoholloven", description: "Lov om omsetning av alkoholholdig drikk m.v.", link: "https://lovdata.no/dokument/NL/lov/1989-06-02-27" },
  { name: "Alkoholforskriften", description: "Forskrift om omsetning av alkoholholdig drikk mv.", link: "https://lovdata.no/dokument/SF/forskrift/2005-06-08-538" },
  { name: "Serveringsforskriften", description: "Forskrift om serveringsvirksomhet", link: "https://lovdata.no/dokument/SF/forskrift/1983-07-08-1252" },
];

export default function IkAlkoholKontroll() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { controls, isLoading, saveControl, deleteControl, companyId } = useIkAlkoholControls();
  const [activeTab, setActiveTab] = useState("daglig");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");

  const openChecklist = (type: 'daily' | 'monthly' | 'yearly', category: string, items: ChecklistItem[]) => {
    setSelectedType(type);
    setSelectedCategory(category);
    setChecklistItems(items.map(i => ({ ...i, checked: false, comment: "" })));
    setNotes("");
    setShowDialog(true);
  };

  const toggleItem = (id: string) => {
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const updateComment = (id: string, comment: string) => {
    setChecklistItems(prev => prev.map(i => i.id === id ? { ...i, comment } : i));
  };

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!companyId) return;
    await saveControl.mutateAsync({
      company_id: companyId,
      control_type: selectedType,
      control_category: selectedCategory,
      control_date: new Date().toISOString().split('T')[0],
      checklist_items: checklistItems as any,
      notes: notes || null,
      completed_by_id: profile?.id || null,
      completed_by_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
      status,
    });
    setShowDialog(false);
  };

  const getControlsForType = (type: string) => controls.filter(c => c.control_type === type);

  const renderCategoryCards = (
    checklists: Record<string, ChecklistItem[]>,
    type: 'daily' | 'monthly' | 'yearly'
  ) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(checklists).map(([category, items]) => {
        const recent = controls.find(c => c.control_type === type && c.control_category === category);
        return (
          <Card key={category} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category}</CardTitle>
                {recent && (
                  <Badge variant={recent.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {recent.status === 'completed' ? 'Utført' : 'Utkast'}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {items.length} sjekkpunkter
                {recent && (
                  <span className="ml-2">
                    · Sist: {format(new Date(recent.control_date), "d. MMM yyyy", { locale: nb })}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                className="w-full"
                onClick={() => openChecklist(type, category, items)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Start kontroll
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderHistory = (type: string) => {
    const entries = getControlsForType(type);
    if (entries.length === 0) return <p className="text-muted-foreground text-sm py-4">Ingen kontroller registrert ennå.</p>;
    return (
      <div className="space-y-2 mt-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Utførte kontroller</h3>
        {entries.slice(0, 10).map(entry => {
          const items = (entry.checklist_items || []) as ChecklistItem[];
          const checked = items.filter(i => i.checked).length;
          return (
            <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {entry.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Clock className="h-5 w-5 text-warning" />
                )}
                <div>
                  <p className="text-sm font-medium">{entry.control_category}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.control_date), "d. MMM yyyy", { locale: nb })}
                    {entry.completed_by_name && ` · ${entry.completed_by_name}`}
                    {` · ${checked}/${items.length} sjekkpunkter`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteControl.mutate(entry.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ik-alkohol")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Kontroll</h1>
          <p className="text-muted-foreground mt-1">Dokumenter daglige, månedlige og årlige kontroller</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daglig" className="gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Daglig</span>
          </TabsTrigger>
          <TabsTrigger value="maanedlig" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Månedlig</span>
          </TabsTrigger>
          <TabsTrigger value="aarlig" className="gap-1.5">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Årlig</span>
          </TabsTrigger>
          <TabsTrigger value="regelverk" className="gap-1.5">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Regelverk</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daglig" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">📅 Daglige kontroller</h2>
            <p className="text-sm text-muted-foreground mb-4">Driftskontroll – dette er det kommunen forventer at virksomheten følger opp i praksis.</p>
          </div>
          {renderCategoryCards(DAILY_CHECKLISTS, 'daily')}
          {renderHistory('daily')}
        </TabsContent>

        <TabsContent value="maanedlig" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">📆 Månedlige kontroller</h2>
            <p className="text-sm text-muted-foreground mb-4">Internkontroll – systematisk oppfølging av IK-systemet.</p>
          </div>
          {renderCategoryCards(MONTHLY_CHECKLISTS, 'monthly')}
          {renderHistory('monthly')}
        </TabsContent>

        <TabsContent value="aarlig" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">📑 Årlige / periodiske krav</h2>
            <p className="text-sm text-muted-foreground mb-4">Krav som skal oppfylles årlig eller ved endringer.</p>
          </div>
          {renderCategoryCards(YEARLY_CHECKLISTS, 'yearly')}
          {renderHistory('yearly')}
        </TabsContent>

        <TabsContent value="regelverk" className="mt-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">⚖️ Relevant regelverk</h2>
            <p className="text-sm text-muted-foreground mb-4">Regelverket som IK-Alkohol bygger på.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REGELVERK.map(r => (
              <Card key={r.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <CardDescription>{r.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <a href={r.link} target="_blank" rel="noopener noreferrer">Åpne i Lovdata ↗</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">🔎 Hva kommunen ser etter ved tilsyn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Internkontrollsystem</li>
                <li>Risikoanalyse</li>
                <li>Opplæringsdokumentasjon</li>
                <li>Avvikssystem</li>
                <li>Rutiner for alderskontroll</li>
                <li>Rutiner for håndtering av berusede</li>
                <li>Dokumentasjon på årlig gjennomgang</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Checklist Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCategory}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {checklistItems.map(item => (
              <div key={item.id} className="space-y-2 border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-0.5"
                  />
                  <label htmlFor={item.id} className="text-sm font-medium cursor-pointer leading-snug">
                    {item.text}
                  </label>
                </div>
                <Textarea
                  placeholder="Kommentar (valgfritt)"
                  value={item.comment || ""}
                  onChange={e => updateComment(item.id, e.target.value)}
                  className="min-h-[50px] text-xs"
                />
              </div>
            ))}

            <div>
              <label className="text-sm font-medium">Notater</label>
              <Textarea
                placeholder="Generelle notater..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[80px] mt-1"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
              <Button variant="outline" onClick={() => handleSave('draft')} disabled={saveControl.isPending}>
                Lagre utkast
              </Button>
              <Button onClick={() => handleSave('completed')} disabled={saveControl.isPending}>
                Fullfør kontroll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
