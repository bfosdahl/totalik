import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertCircle, Download, FileSpreadsheet } from "lucide-react";
import { useKsProjects } from "@/hooks/useKsProjects";
import { useKsAvvik, type KsAvvik, type NewKsAvvikInput } from "@/hooks/useKsAvvik";
import { Checkbox } from "@/components/ui/checkbox";
import { exportKsAvvikToPDF, exportKsAvvikToExcel, exportSingleKsAvvikToPDF } from "@/utils/ksAvvikExport";
import { useAuth } from "@/contexts/AuthContext";

const priorityConfig = {
  low: { label: "Lav", color: "bg-blue-500" },
  medium: { label: "Middels", color: "bg-yellow-500" },
  high: { label: "Høy", color: "bg-red-500" },
};

const statusConfig = {
  open: { label: "Åpen", color: "bg-red-100 text-red-800" },
  in_progress: { label: "Under arbeid", color: "bg-yellow-100 text-yellow-800" },
  closed: { label: "Lukket", color: "bg-green-100 text-green-800" },
};

const categoryConfig = {
  quality: { label: "Kvalitet", icon: AlertCircle },
  safety: { label: "Sikkerhet", icon: AlertCircle },
  environment: { label: "Miljø", icon: AlertCircle },
  documentation: { label: "Dokumentasjon", icon: AlertCircle },
  other: { label: "Annet", icon: AlertCircle },
};

export default function KsAvvik() {
  const { toast } = useToast();
  const { company } = useAuth();
  const { projects } = useKsProjects();
  const { avvikList, isLoading, createAvvik, updateAvvik, deleteAvvik } = useKsAvvik();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvvik, setEditingAvvik] = useState<KsAvvik | null>(null);
  const [reportType, setReportType] = useState<'avvik' | 'ruh'>('avvik');
  const [formData, setFormData] = useState<any>({
    project_id: "",
    avvik_nummer: "",
    tittel: "",
    beskrivelse: "",
    kategori: "quality",
    prioritet: "medium",
    status: "open",
    ansvarlig: "",
    frist: "",
    oppdaget_dato: new Date().toISOString().split('T')[0],
    oppdaget_sted: "",
  });

  const resetForm = () => {
    setFormData({
      project_id: "",
      avvik_nummer: "",
      tittel: "",
      beskrivelse: "",
      kategori: "quality",
      prioritet: "medium",
      status: "open",
      ansvarlig: "",
      frist: "",
      oppdaget_dato: new Date().toISOString().split('T')[0],
      oppdaget_sted: "",
    });
    setReportType('avvik');
    setEditingAvvik(null);
  };

  const handleSubmit = () => {
    if (!formData.avvik_nummer || !formData.tittel || !formData.project_id) {
      toast({ title: "Feil", description: "Nummer, tittel og prosjekt er påkrevd.", variant: "destructive" });
      return;
    }

    if (editingAvvik) {
      updateAvvik({ id: editingAvvik.id, updates: { ...formData, type: reportType } });
      setIsDialogOpen(false);
      setEditingAvvik(null);
      resetForm();
    } else {
      createAvvik({ ...formData, type: reportType } as NewKsAvvikInput);
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (avvik: KsAvvik) => {
    setEditingAvvik(avvik);
    setReportType(avvik.type || 'avvik');
    setFormData({
      project_id: avvik.project_id || "",
      avvik_nummer: avvik.avvik_nummer,
      tittel: avvik.tittel,
      beskrivelse: avvik.beskrivelse || "",
      kategori: avvik.kategori,
      prioritet: avvik.prioritet,
      status: avvik.status,
      ansvarlig: avvik.ansvarlig || "",
      frist: avvik.frist || "",
      oppdaget_dato: avvik.oppdaget_dato,
      oppdaget_sted: avvik.oppdaget_sted || "",
      incident_time: avvik.incident_time || "",
      incident_location: avvik.incident_location || "",
      incident_type: avvik.incident_type || "",
      severity: avvik.severity || "",
      consequences: avvik.consequences || "",
      involved_persons: avvik.involved_persons || "",
      root_cause_analysis: avvik.root_cause_analysis || "",
      immediate_actions: avvik.immediate_actions || "",
      preventive_measures: avvik.preventive_measures || "",
      reporter_contact: avvik.reporter_contact || "",
      responsible_receiver: avvik.responsible_receiver || "",
      notify_arbeidstilsynet: avvik.notify_arbeidstilsynet || false,
      notify_insurance: avvik.notify_insurance || false,
      additional_info: avvik.additional_info || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne rapporten?")) {
      deleteAvvik(id);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Avvik / RUH</h1>
            <p className="text-muted-foreground">Registrer avvik og rapporter uønskede hendelser</p>
          </div>
          <div className="flex gap-2">
            {avvikList.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => exportKsAvvikToPDF(avvikList, company?.name)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Last ned PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportKsAvvikToExcel(avvikList, company?.name)}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Last ned Excel
                </Button>
              </>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ny Rapport
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAvvik 
                    ? `Rediger ${editingAvvik.type === 'ruh' ? 'RUH' : 'Avvik'}` 
                    : `Ny ${reportType === 'avvik' ? 'Avvik' : 'RUH (Rapport Uønsket Hendelse)'}`}
                </DialogTitle>
              </DialogHeader>
              
              {!editingAvvik && (
                <div className="flex gap-2 mb-4 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant={reportType === 'avvik' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setReportType('avvik')}
                  >
                    Avvik
                  </Button>
                  <Button
                    type="button"
                    variant={reportType === 'ruh' ? 'default' : 'ghost'}
                    className="flex-1"
                    onClick={() => setReportType('ruh')}
                  >
                    RUH
                  </Button>
                </div>
              )}
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project_id">Prosjekt *</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, project_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prosjekt" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_number} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="avvik_nummer">{reportType === 'avvik' ? 'Avviksnummer' : 'RUH-nummer'} *</Label>
                    <Input
                      id="avvik_nummer"
                      value={formData.avvik_nummer}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, avvik_nummer: e.target.value }))}
                      placeholder={reportType === 'avvik' ? "F.eks. AVK-001" : "F.eks. RUH-001"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oppdaget_dato">{reportType === 'avvik' ? 'Oppdaget dato' : 'Dato for hendelse'} *</Label>
                    <Input
                      type="date"
                      id="oppdaget_dato"
                      value={formData.oppdaget_dato}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, oppdaget_dato: e.target.value }))}
                    />
                  </div>
                </div>

                {reportType === 'ruh' && (
                  <div className="space-y-2">
                    <Label htmlFor="incident_time">Klokkeslett for hendelse</Label>
                    <Input
                      type="time"
                      id="incident_time"
                      value={formData.incident_time || ""}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, incident_time: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tittel">Tittel *</Label>
                  <Input
                    id="tittel"
                    value={formData.tittel}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, tittel: e.target.value }))}
                    placeholder={reportType === 'avvik' ? "Kort beskrivelse av avviket" : "Kort beskrivelse av hendelsen"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={reportType === 'avvik' ? 'oppdaget_sted' : 'incident_location'}>
                    {reportType === 'avvik' ? 'Sted' : 'Adresse/sted for hendelse'} {reportType === 'ruh' && '*'}
                  </Label>
                  <Input
                    id={reportType === 'avvik' ? 'oppdaget_sted' : 'incident_location'}
                    value={reportType === 'avvik' ? formData.oppdaget_sted : formData.incident_location}
                    onChange={(e) => setFormData((prev: any) => ({ 
                      ...prev, 
                      [reportType === 'avvik' ? 'oppdaget_sted' : 'incident_location']: e.target.value 
                    }))}
                    placeholder={reportType === 'avvik' ? "F.eks. 2. etasje, rom 201" : "Nøyaktig adresse eller sted"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beskrivelse">
                    {reportType === 'avvik' ? 'Beskrivelse' : 'Detaljert beskrivelse av hendelsesforløp'} *
                  </Label>
                  <Textarea
                    id="beskrivelse"
                    value={formData.beskrivelse}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, beskrivelse: e.target.value }))}
                    placeholder={reportType === 'avvik' 
                      ? "Detaljert beskrivelse av avviket..." 
                      : "Beskriv hva som skjedde, hendelsesforløp og situasjonen på stedet..."}
                    className="min-h-[100px]"
                  />
                </div>

                {reportType === 'ruh' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="incident_type">Type uønsket hendelse *</Label>
                      <Select value={formData.incident_type || ""} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, incident_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fall">Fall</SelectItem>
                          <SelectItem value="nestenulykke">Nestenulykke</SelectItem>
                          <SelectItem value="velt">Velt</SelectItem>
                          <SelectItem value="brann">Brann</SelectItem>
                          <SelectItem value="klemskade">Klemskade</SelectItem>
                          <SelectItem value="kutt">Kutt/Sår</SelectItem>
                          <SelectItem value="kjemikalie">Kjemikalieeksponering</SelectItem>
                          <SelectItem value="annet">Annet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="severity">Alvorlighetsgrad *</Label>
                      <Select value={formData.severity || ""} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, severity: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg alvorlighetsgrad..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="observation">Observasjon</SelectItem>
                          <SelectItem value="near_miss">Nestenulykke</SelectItem>
                          <SelectItem value="injury">Personskade</SelectItem>
                          <SelectItem value="serious_injury">Alvorlig personskade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="consequences">Konsekvenser (Person-/Materiellskader)</Label>
                      <Textarea
                        id="consequences"
                        value={formData.consequences || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, consequences: e.target.value }))}
                        placeholder="Beskriv eventuelle skader på person eller materiell..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="involved_persons">Involverte personer</Label>
                      <Textarea
                        id="involved_persons"
                        value={formData.involved_persons || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, involved_persons: e.target.value }))}
                        placeholder="Navn på involverte eller utsatte personer, eller 'Ingen' hvis ikke aktuelt..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reporter_contact">Kontaktinformasjon til melder</Label>
                      <Input
                        id="reporter_contact"
                        value={formData.reporter_contact || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, reporter_contact: e.target.value }))}
                        placeholder="Telefon, e-post, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responsible_receiver">Ansvarlig mottaker av rapport</Label>
                      <Input
                        id="responsible_receiver"
                        value={formData.responsible_receiver || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, responsible_receiver: e.target.value }))}
                        placeholder="Navn på ansvarlig mottaker"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="root_cause_analysis">Årsaksanalyse</Label>
                      <Textarea
                        id="root_cause_analysis"
                        value={formData.root_cause_analysis || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, root_cause_analysis: e.target.value }))}
                        placeholder="Vurdering av årsak(er) til hendelsen..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="immediate_actions">Umiddelbare tiltak iverksatt</Label>
                      <Textarea
                        id="immediate_actions"
                        value={formData.immediate_actions || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, immediate_actions: e.target.value }))}
                        placeholder="Beskrivelse av umiddelbare tiltak som ble iverksatt..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preventive_measures">Forbedringstiltak for å forhindre gjentakelse</Label>
                      <Textarea
                        id="preventive_measures"
                        value={formData.preventive_measures || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, preventive_measures: e.target.value }))}
                        placeholder="Forslag til forbedringstiltak..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additional_info">Tilleggsinformasjon</Label>
                      <Textarea
                        id="additional_info"
                        value={formData.additional_info || ""}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, additional_info: e.target.value }))}
                        placeholder="Annen relevant informasjon..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-base">Kontakt med myndigheter/forsikring</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="notify_arbeidstilsynet"
                          checked={formData.notify_arbeidstilsynet || false}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, notify_arbeidstilsynet: e.target.checked }))}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="notify_arbeidstilsynet" className="font-normal cursor-pointer">
                          Skal Arbeidstilsynet kontaktes?
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="notify_insurance"
                          checked={formData.notify_insurance || false}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, notify_insurance: e.target.checked }))}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="notify_insurance" className="font-normal cursor-pointer">
                          Skal forsikringsselskap kontaktes?
                        </Label>
                      </div>
                    </div>
                  </>
                )}

                {reportType === 'avvik' && (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="kategori">Kategori</Label>
                        <Select value={formData.kategori} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, kategori: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryConfig).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="prioritet">Prioritet</Label>
                        <Select value={formData.prioritet} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, prioritet: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(priorityConfig).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ansvarlig">Ansvarlig</Label>
                        <Input
                          id="ansvarlig"
                          value={formData.ansvarlig}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, ansvarlig: e.target.value }))}
                          placeholder="Navn på ansvarlig"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frist">Frist</Label>
                        <Input
                          type="date"
                          id="frist"
                          value={formData.frist}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, frist: e.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
                <Button onClick={handleSubmit}>
                  {editingAvvik ? "Lagre endringer" : "Opprett"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Laster rapporter...</div>
        ) : avvikList.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen rapporter registrert ennå</p>
              <p className="text-sm text-muted-foreground">Klikk "Ny Rapport" for å registrere avvik eller RUH</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {avvikList.map((avvik) => (
              <Card key={avvik.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{avvik.tittel}</CardTitle>
                        <Badge variant="outline">{avvik.avvik_nummer}</Badge>
                        <Badge variant={avvik.type === 'ruh' ? 'destructive' : 'default'}>
                          {avvik.type === 'ruh' ? 'RUH' : 'Avvik'}
                        </Badge>
                      </div>
                      <CardDescription>{avvik.beskrivelse}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => exportSingleKsAvvikToPDF(avvik, company?.name)}
                        title="Last ned PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(avvik)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(avvik.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {avvik.type !== 'ruh' && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Kategori:</span>
                        <span>{categoryConfig[avvik.kategori as keyof typeof categoryConfig]?.label}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {avvik.type === 'ruh' ? 'Alvorlighetsgrad:' : 'Prioritet:'}
                      </span>
                      <span>
                        {avvik.type === 'ruh' 
                          ? (avvik.severity === 'observation' ? 'Observasjon' :
                             avvik.severity === 'near_miss' ? 'Nestenulykke' :
                             avvik.severity === 'injury' ? 'Personskade' :
                             avvik.severity === 'serious_injury' ? 'Alvorlig personskade' : '-')
                          : priorityConfig[avvik.prioritet as keyof typeof priorityConfig]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={statusConfig[avvik.status as keyof typeof statusConfig]?.color}>
                        {statusConfig[avvik.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </div>
                    {avvik.ansvarlig && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Ansvarlig:</span>
                        <span>{avvik.ansvarlig}</span>
                      </div>
                    )}
                    {avvik.frist && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Frist:</span>
                        <span>{new Date(avvik.frist).toLocaleDateString('no-NO')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
