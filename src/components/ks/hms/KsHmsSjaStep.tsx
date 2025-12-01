import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserSelect from "@/components/audits/UserSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KsSja } from "@/hooks/useKsHmsPlan";
import { Badge } from "@/components/ui/badge";

interface KsHmsSjaStepProps {
  sjaList: KsSja[];
  onCreate: (sja: Omit<KsSja, 'id' | 'project_id' | 'created_by_user_id' | 'created_at' | 'updated_at'>) => Promise<KsSja | null>;
}

export function KsHmsSjaStep({ sjaList, onCreate }: KsHmsSjaStepProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    work_description: "",
    location: "",
    participants: "",
    date: new Date().toISOString().split("T")[0],
    hazards_json: [],
  });

  const handleCreate = async () => {
    const result = await onCreate({
      ...formData,
      status: "active",
    });

    if (result) {
      setShowNewDialog(false);
      setFormData({
        title: "",
        work_description: "",
        location: "",
        participants: "",
        date: new Date().toISOString().split("T")[0],
        hazards_json: [],
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Sikker Jobb Analyse (SJA) skal gjennomføres før oppstart av kritiske eller risikofylte arbeidsoppgaver.
            SJA identifiserer farer og tiltak for å utføre arbeidet sikkert.
          </p>
        </CardContent>
      </Card>

      {sjaList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen SJA enda</h3>
            <p className="text-muted-foreground text-center mb-4">
              Opprett din første Sikker Jobb Analyse for prosjektet
            </p>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Opprett SJA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {sjaList.map((sja) => (
              <Card key={sja.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{sja.title}</CardTitle>
                      <CardDescription>
                        {sja.location && `${sja.location} • `}
                        {sja.date && new Date(sja.date).toLocaleDateString("nb-NO")}
                      </CardDescription>
                    </div>
                    <Badge variant={sja.status === 'active' ? 'default' : 'secondary'}>
                      {sja.status === 'active' ? 'Aktiv' : sja.status === 'completed' ? 'Fullført' : 'Arkivert'}
                    </Badge>
                  </div>
                </CardHeader>
                {sja.work_description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{sja.work_description}</p>
                    {sja.participants && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Deltakere: {sja.participants}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={() => setShowNewDialog(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Opprett ny SJA
          </Button>
        </>
      )}

      <Button onClick={() => {}} className="w-full">
        Gå videre
      </Button>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ny Sikker Jobb Analyse</DialogTitle>
            <DialogDescription>
              Opprett en SJA for en kritisk arbeidsoppgave
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tittel / Arbeidsoppgave *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="F.eks. Montering av takstoler"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_description">Beskrivelse av arbeidet</Label>
              <Textarea
                id="work_description"
                value={formData.work_description}
                onChange={(e) => setFormData(prev => ({ ...prev, work_description: e.target.value }))}
                placeholder="Beskriv arbeidsoppgaven..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Sted / Lokasjon</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="F.eks. 2. etasje, tak"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Dato</Label>
                <Input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">Deltakere</Label>
              <UserSelect
                value={formData.participants}
                onValueChange={(value) => setFormData(prev => ({ ...prev, participants: value }))}
                placeholder="Velg ansatt eller skriv navn"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreate} disabled={!formData.title.trim()}>
              Opprett SJA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}