import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, Edit, Trash2, Loader2, Sparkles, Clock } from "lucide-react";
import { useIkAlkoholRisks, RISK_AREAS, PROBABILITY_LEVELS, CONSEQUENCE_LEVELS, RISK_LEVEL_COLORS, MEASURE_STATUSES } from "@/hooks/useIkAlkoholRisks";
import { useCompanyModules } from "@/hooks/useCompanyModules";

const IkAlkoholRisikoanalyse = () => {
  const navigate = useNavigate();
  const { modules, isLoading: modulesLoading } = useCompanyModules();
  const { risks, isLoading, createRisk, updateRisk, deleteRisk, initializeDefaultRisks } = useIkAlkoholRisks();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [formData, setFormData] = useState({
    risk_area: '', risk_description: '', probability: 3, consequence: 3, penalty_points: 2,
    existing_controls: '', planned_measures: [] as string[], measure_responsible_name: '', measure_deadline: '',
    is_risk_period: false, risk_period_days: [] as string[], risk_period_times: '',
  });
  const [newMeasure, setNewMeasure] = useState('');

  const hasIkAlkohol = modules?.some(m => m.module_type === 'IK_ALKOHOL' && m.is_active);
  
  if (modulesLoading || isLoading) {
    return <AppLayout><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!hasIkAlkohol) {
    navigate('/');
    return null;
  }

  const handleSave = async () => {
    if (!formData.risk_area || !formData.risk_description) return;
    if (editingRisk) {
      await updateRisk.mutateAsync({ id: editingRisk.id, ...formData });
    } else {
      await createRisk.mutateAsync(formData);
    }
    setShowDialog(false);
    setEditingRisk(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      risk_area: '', risk_description: '', probability: 3, consequence: 3, penalty_points: 2,
      existing_controls: '', planned_measures: [], measure_responsible_name: '', measure_deadline: '',
      is_risk_period: false, risk_period_days: [], risk_period_times: '',
    });
  };

  const openEdit = (risk: any) => {
    setEditingRisk(risk);
    setFormData({
      risk_area: risk.risk_area, risk_description: risk.risk_description, probability: risk.probability,
      consequence: risk.consequence, penalty_points: risk.penalty_points || 2, existing_controls: risk.existing_controls || '',
      planned_measures: risk.planned_measures || [], measure_responsible_name: risk.measure_responsible_name || '',
      measure_deadline: risk.measure_deadline || '', is_risk_period: risk.is_risk_period,
      risk_period_days: risk.risk_period_days || [], risk_period_times: risk.risk_period_times || '',
    });
    setShowDialog(true);
  };

  const addMeasure = () => {
    if (newMeasure.trim()) {
      setFormData({ ...formData, planned_measures: [...formData.planned_measures, newMeasure.trim()] });
      setNewMeasure('');
    }
  };

  const getRiskLevelInfo = (level: string) => RISK_LEVEL_COLORS[level as keyof typeof RISK_LEVEL_COLORS] || RISK_LEVEL_COLORS.low;

  // Group risks by level
  const criticalRisks = risks.filter(r => r.risk_level === 'critical');
  const highRisks = risks.filter(r => r.risk_level === 'high');
  const mediumRisks = risks.filter(r => r.risk_level === 'medium');
  const lowRisks = risks.filter(r => r.risk_level === 'low');

  const RiskCard = ({ risk }: { risk: any }) => {
    const levelInfo = getRiskLevelInfo(risk.risk_level);
    const areaInfo = RISK_AREAS.find(a => a.value === risk.risk_area);
    return (
      <Card className="mb-2">
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${levelInfo.bg} ${levelInfo.text}`}>{levelInfo.label}</Badge>
                {risk.penalty_points && <Badge variant="outline">{risk.penalty_points} prikker</Badge>}
                {risk.is_risk_period && <Badge variant="outline" className="bg-orange-50"><Clock className="h-3 w-3 mr-1" />Risikoperiode</Badge>}
              </div>
              <p className="font-medium">{areaInfo?.label}: {risk.risk_description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sannsynlighet: {risk.probability} × Konsekvens: {risk.consequence} = {risk.probability * risk.consequence}
              </p>
              {risk.existing_controls && <p className="text-sm mt-2"><span className="font-medium">Eksisterende tiltak:</span> {risk.existing_controls}</p>}
              {risk.planned_measures?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Planlagte tiltak:</p>
                  <ul className="text-sm">{risk.planned_measures.map((m: string, i: number) => <li key={i}>• {m}</li>)}</ul>
                </div>
              )}
            </div>
            <div className="flex gap-1 ml-4">
              <Button size="sm" variant="ghost" onClick={() => openEdit(risk)}><Edit className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => deleteRisk.mutate(risk.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Risikoanalyse</h1>
            <p className="text-muted-foreground">Risikovurdering med prikksystem</p>
          </div>
          <div className="flex gap-2">
            {risks.length === 0 && (
              <Button variant="outline" onClick={() => initializeDefaultRisks.mutate()} disabled={initializeDefaultRisks.isPending}>
                <Sparkles className="h-4 w-4 mr-2" />Legg til eksempler
              </Button>
            )}
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Ny risiko
            </Button>
          </div>
        </div>

        {/* Risk Matrix Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-red-700">{criticalRisks.length}</p>
              <p className="text-sm text-red-600">Kritisk</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-orange-700">{highRisks.length}</p>
              <p className="text-sm text-orange-600">Høy</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{mediumRisks.length}</p>
              <p className="text-sm text-yellow-600">Middels</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-700">{lowRisks.length}</p>
              <p className="text-sm text-green-600">Lav</p>
            </CardContent>
          </Card>
        </div>

        {risks.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Ingen risikoer registrert</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {criticalRisks.length > 0 && <div><h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Kritiske risikoer</h3>{criticalRisks.map(r => <RiskCard key={r.id} risk={r} />)}</div>}
            {highRisks.length > 0 && <div><h3 className="font-semibold text-orange-700 mb-2">Høye risikoer</h3>{highRisks.map(r => <RiskCard key={r.id} risk={r} />)}</div>}
            {mediumRisks.length > 0 && <div><h3 className="font-semibold text-yellow-700 mb-2">Middels risikoer</h3>{mediumRisks.map(r => <RiskCard key={r.id} risk={r} />)}</div>}
            {lowRisks.length > 0 && <div><h3 className="font-semibold text-green-700 mb-2">Lave risikoer</h3>{lowRisks.map(r => <RiskCard key={r.id} risk={r} />)}</div>}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingRisk ? 'Rediger risiko' : 'Ny risiko'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Risikoområde *</label>
                <Select value={formData.risk_area} onValueChange={(v) => {
                  const area = RISK_AREAS.find(a => a.value === v);
                  setFormData({ ...formData, risk_area: v, penalty_points: area?.points || 2 });
                }}>
                  <SelectTrigger><SelectValue placeholder="Velg område" /></SelectTrigger>
                  <SelectContent>
                    {RISK_AREAS.map(a => <SelectItem key={a.value} value={a.value}>{a.label} ({a.points} prikker)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Beskrivelse av risiko *</label>
                <Textarea value={formData.risk_description} onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sannsynlighet</label>
                  <Select value={String(formData.probability)} onValueChange={(v) => setFormData({ ...formData, probability: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROBABILITY_LEVELS.map(p => <SelectItem key={p.value} value={String(p.value)}>{p.value} - {p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Konsekvens</label>
                  <Select value={String(formData.consequence)} onValueChange={(v) => setFormData({ ...formData, consequence: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONSEQUENCE_LEVELS.map(c => <SelectItem key={c.value} value={String(c.value)}>{c.value} - {c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Eksisterende tiltak</label>
                <Textarea value={formData.existing_controls} onChange={(e) => setFormData({ ...formData, existing_controls: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium">Planlagte tiltak</label>
                <div className="flex gap-2 mb-2">
                  <Input value={newMeasure} onChange={(e) => setNewMeasure(e.target.value)} placeholder="Legg til tiltak" onKeyPress={(e) => e.key === 'Enter' && addMeasure()} />
                  <Button type="button" onClick={addMeasure}>Legg til</Button>
                </div>
                {formData.planned_measures.length > 0 && (
                  <ul className="space-y-1">{formData.planned_measures.map((m, i) => (
                    <li key={i} className="flex items-center justify-between bg-muted/50 px-2 py-1 rounded text-sm">{m}<Button size="sm" variant="ghost" onClick={() => setFormData({ ...formData, planned_measures: formData.planned_measures.filter((_, idx) => idx !== i) })}><Trash2 className="h-3 w-3" /></Button></li>
                  ))}</ul>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Avbryt</Button>
              <Button onClick={handleSave}>Lagre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default IkAlkoholRisikoanalyse;
