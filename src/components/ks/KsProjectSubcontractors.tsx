import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, FileText, Award, ClipboardCheck, Loader2, Building2, Mail, Phone, Briefcase, CheckCircle2, XCircle, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { SubcontractorEvaluation } from "./SubcontractorEvaluation";
import { useKsSubcontractors, useSubcontractorContracts, useSubcontractorCompetence, NewSubcontractorInput } from "@/hooks/useKsSubcontractors";
import { useSubcontractorInspections } from "@/hooks/useSubcontractorInspections";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface KsProjectSubcontractorsProps {
  projectId: string;
}

const DOCUMENT_TYPE_CONFIG = {
  hms_card: { label: "HMS-kort", icon: Award },
  certificate: { label: "Sertifikat", icon: FileText },
  insurance: { label: "Forsikring", icon: ClipboardCheck },
  other: { label: "Annet", icon: FileText },
};

export const KsProjectSubcontractors = ({ projectId }: KsProjectSubcontractorsProps) => {
  const { subcontractors, isLoading, createSubcontractor, isCreating } = useKsSubcontractors(projectId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<NewSubcontractorInput>({
    subcontractor_name: "",
    org_number: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    work_scope: "",
    work_description: "",
    contract_value: undefined,
    start_date: "",
    end_date: "",
  });

  const handleSubmit = () => {
    if (!formData.subcontractor_name || !formData.contact_person || !formData.contact_email || !formData.work_scope) {
      return;
    }

    createSubcontractor(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          subcontractor_name: "",
          org_number: "",
          contact_person: "",
          contact_email: "",
          contact_phone: "",
          work_scope: "",
          work_description: "",
          contract_value: undefined,
          start_date: "",
          end_date: "",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Underleverandører (UE)</h3>
          <p className="text-sm text-muted-foreground">
            Administrer underleverandører, kontrakter og kompetansedokumentasjon
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Legg til UE
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Legg til underleverandør</DialogTitle>
              <DialogDescription>
                Registrer underleverandør med kontaktinformasjon og arbeidsomfang
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subcontractor_name">Firmanavn *</Label>
                  <Input
                    id="subcontractor_name"
                    value={formData.subcontractor_name}
                    onChange={(e) => setFormData({ ...formData, subcontractor_name: e.target.value })}
                    placeholder="F.eks. 'Olsen Rørlegger AS'"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org_number">Org.nr</Label>
                  <Input
                    id="org_number"
                    value={formData.org_number}
                    onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                    placeholder="9 siffer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Kontaktperson *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Navn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">E-post *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="post@firma.no"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_scope">Fagområde *</Label>
                  <Input
                    id="work_scope"
                    value={formData.work_scope}
                    onChange={(e) => setFormData({ ...formData, work_scope: e.target.value })}
                    placeholder="F.eks. 'Rørlegger', 'Elektriker'"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_description">Arbeidsbeskrivelse</Label>
                <Textarea
                  id="work_description"
                  value={formData.work_description}
                  onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                  placeholder="Detaljer om arbeidet som skal utføres"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_value">Kontraktsverdi (NOK)</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    value={formData.contract_value || ""}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Startdato</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Sluttdato</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.subcontractor_name || !formData.contact_person || !formData.contact_email || !formData.work_scope || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  'Legg til'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subcontractors.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen underleverandører registrert ennå</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subcontractors.map((subcontractor) => (
            <Card key={subcontractor.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{subcontractor.subcontractor_name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {subcontractor.work_scope}
                        </span>
                        {subcontractor.org_number && (
                          <span>Org.nr: {subcontractor.org_number}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={subcontractor.status === 'active' ? 'default' : 'secondary'}>
                      {subcontractor.status === 'active' ? 'Aktiv' : subcontractor.status === 'completed' ? 'Fullført' : 'Avsluttet'}
                    </Badge>
                    {subcontractor.approval_status === 'godkjent' && (
                      <Badge className="bg-green-600">✔ Godkjent</Badge>
                    )}
                    {subcontractor.approval_status === 'ikke_godkjent' && (
                      <Badge variant="destructive">✖ Ikke godkjent</Badge>
                    )}
                    {subcontractor.approval_status === 'godkjent_med_forbehold' && (
                      <Badge className="bg-yellow-600">⚠ Godkjent m/forbehold</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="info">Informasjon</TabsTrigger>
                    <TabsTrigger value="evaluation">Gransking</TabsTrigger>
                    <TabsTrigger value="contracts">Kontrakter</TabsTrigger>
                    <TabsTrigger value="competence">Kompetanse</TabsTrigger>
                    <TabsTrigger value="inspections">Kontroller</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Kontaktperson</p>
                        <p className="font-medium">{subcontractor.contact_person}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">E-post</p>
                        <p className="font-medium flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {subcontractor.contact_email}
                        </p>
                      </div>
                      {subcontractor.contact_phone && (
                        <div>
                          <p className="text-muted-foreground mb-1">Telefon</p>
                          <p className="font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {subcontractor.contact_phone}
                          </p>
                        </div>
                      )}
                      {subcontractor.contract_value && (
                        <div>
                          <p className="text-muted-foreground mb-1">Kontraktsverdi</p>
                          <p className="font-medium flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {subcontractor.contract_value.toLocaleString('nb-NO')} NOK
                          </p>
                        </div>
                      )}
                      {subcontractor.start_date && (
                        <div>
                          <p className="text-muted-foreground mb-1">Startdato</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(subcontractor.start_date), "d. MMM yyyy", { locale: nb })}
                          </p>
                        </div>
                      )}
                      {subcontractor.end_date && (
                        <div>
                          <p className="text-muted-foreground mb-1">Sluttdato</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(subcontractor.end_date), "d. MMM yyyy", { locale: nb })}
                          </p>
                        </div>
                      )}
                    </div>
                    {subcontractor.work_description && (
                      <div>
                        <p className="text-muted-foreground mb-1 text-sm">Arbeidsbeskrivelse</p>
                        <p className="text-sm">{subcontractor.work_description}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="evaluation" className="pt-4">
                    <SubcontractorEvaluation subcontractorId={subcontractor.id} />
                  </TabsContent>
                  
                  <TabsContent value="contracts" className="pt-4">
                    <SubcontractorContracts subcontractorId={subcontractor.id} />
                  </TabsContent>
                  
                  <TabsContent value="competence" className="pt-4">
                    <SubcontractorCompetenceTab subcontractorId={subcontractor.id} />
                  </TabsContent>
                  
                  <TabsContent value="inspections" className="pt-4">
                    <SubcontractorInspectionsTab subcontractorId={subcontractor.id} projectId={projectId} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Contracts sub-component
const SubcontractorContracts = ({ subcontractorId }: { subcontractorId: string }) => {
  const { contracts, isLoading, uploadContract, isUploading, downloadContract } = useSubcontractorContracts(subcontractorId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    contract_name: "",
    contract_number: "",
    contract_date: "",
    contract_value: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!selectedFile || !formData.contract_name) return;

    uploadContract({
      contract_name: formData.contract_name,
      contract_number: formData.contract_number || undefined,
      contract_date: formData.contract_date || undefined,
      contract_value: formData.contract_value ? parseFloat(formData.contract_value) : undefined,
      description: formData.description || undefined,
      file: selectedFile,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ contract_name: "", contract_number: "", contract_date: "", contract_value: "", description: "" });
        setSelectedFile(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Last opp kontrakt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Last opp kontrakt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kontraktnavn *</Label>
                <Input
                  value={formData.contract_name}
                  onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
                  placeholder="F.eks. 'Entreprisekontrakt rørlegger'"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontraktnummer</Label>
                  <Input
                    value={formData.contract_number}
                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                    placeholder="Referansenummer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kontraktsdato</Label>
                  <Input
                    type="date"
                    value={formData.contract_date}
                    onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kontraktsverdi (NOK)</Label>
                <Input
                  type="number"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Fil *</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
              <Button onClick={handleSubmit} disabled={!selectedFile || !formData.contract_name || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Last opp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Ingen kontrakter lastet opp</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((contract) => (
            <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{contract.contract_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.contract_date && format(new Date(contract.contract_date), "d. MMM yyyy", { locale: nb })}
                    {contract.contract_value && ` • ${contract.contract_value.toLocaleString('nb-NO')} NOK`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => downloadContract(contract)}>
                Last ned
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Competence sub-component
const SubcontractorCompetenceTab = ({ subcontractorId }: { subcontractorId: string }) => {
  const { competence, isLoading, uploadCompetence, isUploading } = useSubcontractorCompetence(subcontractorId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    document_type: "hms_card" as const,
    document_name: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!selectedFile || !formData.document_name) return;

    uploadCompetence({
      document_type: formData.document_type,
      document_name: formData.document_name,
      document_number: formData.document_number || undefined,
      issue_date: formData.issue_date || undefined,
      expiry_date: formData.expiry_date || undefined,
      notes: formData.notes || undefined,
      file: selectedFile,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ document_type: "hms_card", document_name: "", document_number: "", issue_date: "", expiry_date: "", notes: "" });
        setSelectedFile(null);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Last opp dokumentasjon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Last opp kompetansedokumentasjon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type dokument *</Label>
                <Select value={formData.document_type} onValueChange={(value: any) => setFormData({ ...formData, document_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dokumentnavn *</Label>
                <Input
                  value={formData.document_name}
                  onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                  placeholder="F.eks. 'HMS-kort Ole Hansen'"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dokumentnummer</Label>
                  <Input
                    value={formData.document_number}
                    onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Utløpsdato</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notater</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Fil *</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
              <Button onClick={handleSubmit} disabled={!selectedFile || !formData.document_name || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Last opp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {competence.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Ingen dokumentasjon lastet opp</p>
        </div>
      ) : (
        <div className="space-y-2">
          {competence.map((doc) => {
            const config = DOCUMENT_TYPE_CONFIG[doc.document_type];
            const Icon = config.icon;
            return (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{doc.document_name}</p>
                      <Badge variant="outline" className="text-xs">{config.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {doc.expiry_date && `Utløper: ${format(new Date(doc.expiry_date), "d. MMM yyyy", { locale: nb })}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Inspections sub-component
const SubcontractorInspectionsTab = ({ subcontractorId, projectId }: { subcontractorId: string; projectId: string }) => {
  const { inspections, isLoading, createInspection, isCreating } = useSubcontractorInspections(subcontractorId, projectId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    inspection_date: "",
    inspector_name: "",
    work_area: "",
    status: "approved" as const,
    findings: "",
    corrective_actions: "",
  });

  const handleSubmit = () => {
    if (!formData.inspection_date || !formData.inspector_name || !formData.work_area) return;

    createInspection({
      inspection_date: formData.inspection_date,
      inspector_name: formData.inspector_name,
      work_area: formData.work_area,
      status: formData.status,
      findings: formData.findings || undefined,
      corrective_actions: formData.corrective_actions || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ inspection_date: "", inspector_name: "", work_area: "", status: "approved", findings: "", corrective_actions: "" });
      },
    });
  };

  const statusConfig = {
    approved: { label: "Godkjent", icon: CheckCircle2, color: "text-green-600" },
    approved_with_remarks: { label: "Godkjent med merknader", icon: AlertCircle, color: "text-yellow-600" },
    rejected: { label: "Ikke godkjent", icon: XCircle, color: "text-red-600" },
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Registrer kontroll
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrer UE-kontroll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontrolldato *</Label>
                  <Input
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kontrollør *</Label>
                  <Input
                    value={formData.inspector_name}
                    onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                    placeholder="Navn på kontrollør"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Arbeidsområde *</Label>
                <Input
                  value={formData.work_area}
                  onChange={(e) => setFormData({ ...formData, work_area: e.target.value })}
                  placeholder="F.eks. 'Rørinstallasjon bad 2. etg.'"
                />
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Godkjent</SelectItem>
                    <SelectItem value="approved_with_remarks">Godkjent med merknader</SelectItem>
                    <SelectItem value="rejected">Ikke godkjent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Funn</Label>
                <Textarea
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  rows={3}
                  placeholder="Beskriv eventuelle funn"
                />
              </div>
              <div className="space-y-2">
                <Label>Korrigerende tiltak</Label>
                <Textarea
                  value={formData.corrective_actions}
                  onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
                  rows={3}
                  placeholder="Tiltak som må gjøres"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Avbryt</Button>
              <Button onClick={handleSubmit} disabled={!formData.inspection_date || !formData.inspector_name || !formData.work_area || isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Registrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {inspections.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Ingen kontroller registrert</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inspections.map((inspection) => {
            const config = statusConfig[inspection.status];
            const Icon = config.icon;
            return (
              <div key={inspection.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <div>
                      <p className="font-medium text-sm">{inspection.work_area}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inspection.inspection_date), "d. MMM yyyy", { locale: nb })} • {inspection.inspector_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant={inspection.status === 'approved' ? 'default' : inspection.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {config.label}
                  </Badge>
                </div>
                {inspection.findings && (
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Funn:</p>
                    <p>{inspection.findings}</p>
                  </div>
                )}
                {inspection.corrective_actions && (
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Tiltak:</p>
                    <p>{inspection.corrective_actions}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
