import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Trash2, Edit, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useKsRoutines } from '@/hooks/useKsRoutines';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CATEGORIES = [
  { value: 'a', label: 'a) Identifisere og ivareta krav' },
  { value: 'b', label: 'b) Ivareta plikter og oppgaver' },
  { value: 'c', label: 'c) Styre andre foretak' },
  { value: 'd', label: 'd) Behandle avvik' },
  { value: 'e', label: 'e) Versjonshåndtering og dokumentasjon' },
  { value: 'f', label: 'f) Organisasjonsplan' },
  { value: 'g', label: 'g) Oppdatere kunnskaper' },
  { value: 'h', label: 'h) Gjennomgang og oppdatering' },
];

export default function KsRoutines() {
  const navigate = useNavigate();
  const { routines, isLoading, createRoutine, updateRoutine, deleteRoutine } = useKsRoutines();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<string | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    routine_number: '',
    name: '',
    category: '',
    purpose: '',
    responsibility: '',
    procedure: '',
    examples: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRoutine) {
      await updateRoutine(editingRoutine, formData);
    } else {
      await createRoutine(formData);
    }
    
    setDialogOpen(false);
    setEditingRoutine(null);
    setFormData({
      routine_number: '',
      name: '',
      category: '',
      purpose: '',
      responsibility: '',
      procedure: '',
      examples: '',
      notes: '',
    });
  };

  const handleEdit = (routine: any) => {
    setEditingRoutine(routine.id);
    setFormData({
      routine_number: routine.routine_number,
      name: routine.name,
      category: routine.category || '',
      purpose: routine.purpose || '',
      responsibility: routine.responsibility || '',
      procedure: routine.procedure || '',
      examples: routine.examples || '',
      notes: routine.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteRoutine(id);
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return null;
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">KS Rutiner</h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                Kvalitetssikringsrutiner i henhold til SAK10 § 10-1
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={() => {
                setEditingRoutine(null);
                setFormData({
                  routine_number: '',
                  name: '',
                  category: '',
                  purpose: '',
                  responsibility: '',
                  procedure: '',
                  examples: '',
                  notes: '',
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Ny rutine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRoutine ? 'Rediger rutine' : 'Opprett ny rutine'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="routine_number">Rutine nr.</Label>
                    <Input
                      id="routine_number"
                      value={formData.routine_number}
                      onChange={(e) => setFormData({ ...formData, routine_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori (SAK10 § 10-1)</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Rutine navn</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="purpose">Formål</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="responsibility">Ansvar</Label>
                  <Textarea
                    id="responsibility"
                    value={formData.responsibility}
                    onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="procedure">Fremgangsmåte</Label>
                  <Textarea
                    id="procedure"
                    value={formData.procedure}
                    onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="examples">Eksempler</Label>
                  <Textarea
                    id="examples"
                    value={formData.examples}
                    onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Husk / Merknader</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">
                    {editingRoutine ? 'Oppdater' : 'Opprett'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Laster rutiner...</p>
          </div>
        ) : routines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Ingen rutiner opprettet ennå
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Opprett kvalitetssikringsrutiner i henhold til SAK10 § 10-1 for å sikre
                etterlevelse av krav i plan- og bygningsloven
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Card key={routine.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{routine.routine_number}</Badge>
                        {routine.category && (
                          <Badge variant="secondary">
                            {getCategoryLabel(routine.category)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{routine.name}</CardTitle>
                      {routine.purpose && (
                        <CardDescription className="mt-2">
                          {routine.purpose}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedRoutine(
                          expandedRoutine === routine.id ? null : routine.id
                        )}
                      >
                        {expandedRoutine === routine.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(routine)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slett rutine?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil slette denne rutinen? Dette kan ikke angres.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(routine.id)}>
                              Slett
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {expandedRoutine === routine.id && (
                  <CardContent className="space-y-4 border-t pt-4">
                    {routine.responsibility && (
                      <div>
                        <h4 className="font-semibold mb-2">Ansvar</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {routine.responsibility}
                        </p>
                      </div>
                    )}
                    {routine.procedure && (
                      <div>
                        <h4 className="font-semibold mb-2">Fremgangsmåte</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {routine.procedure}
                        </p>
                      </div>
                    )}
                    {routine.examples && (
                      <div>
                        <h4 className="font-semibold mb-2">Eksempler</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {routine.examples}
                        </p>
                      </div>
                    )}
                    {routine.notes && (
                      <div>
                        <h4 className="font-semibold mb-2">Husk</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {routine.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
