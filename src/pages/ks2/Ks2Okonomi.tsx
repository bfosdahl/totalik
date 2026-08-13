import { useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, DollarSign, TrendingUp, TrendingDown, Receipt, FileText, Trash2, CheckCircle2, Clock, Save, Upload, Paperclip, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useKsModule2Finances, Invoice, CostEntry } from "@/hooks/useKsModule2Finances";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { t } from "@/i18n/t";

const COST_CATEGORIES = [
  { value: "materials", label: t("auto.materialer") },
  { value: "labor", label: t("auto.arbeidskraft") },
  { value: "subcontractors", label: t("auto.underleverandoerer") },
  { value: "equipment", label: t("auto.utstyr_maskiner") },
  { value: "transport", label: t("auto.transport") },
  { value: "other", label: t("auto.annet") },
];

const INVOICE_STATUSES = [
  { value: "draft", label: t("auto.utkast"), color: "bg-muted text-muted-foreground" },
  { value: "sent", label: t("auto.sendt"), color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "paid", label: t("auto.betalt"), color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "overdue", label: t("auto.forfalt"), color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

export default function Ks2Okonomi() {
  const { projectId } = useParams<{ projectId: string }>();
  const { company, profile } = useAuth();
  const {
    finances,
    costEntries,
    invoices,
    isLoading,
    upsertFinances,
    createCostEntry,
    deleteCostEntry,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  } = useKsModule2Finances(projectId);

  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<{ type: "cost" | "invoice"; id: string } | null>(null);
  const [costFile, setCostFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const costFileRef = useRef<HTMLInputElement>(null);
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  const [budgetForm, setBudgetForm] = useState({
    contract_sum: "",
    budget_materials: "",
    budget_labor: "",
    budget_subcontractors: "",
    budget_other: "",
  });

  const [costForm, setCostForm] = useState({
    category: "materials",
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    supplier: "",
    invoice_number: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: "",
    description: "",
    amount: "",
    invoice_date: format(new Date(), "yyyy-MM-dd"),
    due_date: "",
    status: "sent",
  });

  const uploadFile = async (file: File, prefix: string): Promise<{ path: string; name: string } | null> => {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${projectId}/${prefix}/${Date.now()}_${sanitizedName}`;
    
    const { error } = await supabase.storage
      .from("ks-module2-files")
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      toast.error(t("auto.kunne_ikke_laste_opp_fil"));
      return null;
    }
    return { path: filePath, name: file.name };
  };

  const viewFile = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("ks-module2-files")
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudget = (finances?.budget_materials || 0) + (finances?.budget_labor || 0) +
      (finances?.budget_subcontractors || 0) + (finances?.budget_other || 0);
    
    const totalActual = costEntries.reduce((sum, e) => sum + e.amount, 0);
    
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
    
    const contractSum = finances?.contract_sum || 0;
    const changeOrders = finances?.change_orders_sum || 0;
    const totalContract = contractSum + changeOrders;
    
    const margin = totalContract - totalActual;
    const marginPercent = totalContract > 0 ? (margin / totalContract) * 100 : 0;
    const budgetUsed = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      totalInvoiced,
      totalPaid,
      contractSum,
      changeOrders,
      totalContract,
      margin,
      marginPercent,
      budgetUsed,
    };
  }, [finances, costEntries, invoices]);

  const handleOpenBudget = () => {
    setBudgetForm({
      contract_sum: finances?.contract_sum?.toString() || "",
      budget_materials: finances?.budget_materials?.toString() || "",
      budget_labor: finances?.budget_labor?.toString() || "",
      budget_subcontractors: finances?.budget_subcontractors?.toString() || "",
      budget_other: finances?.budget_other?.toString() || "",
    });
    setBudgetDialogOpen(true);
  };

  const handleSaveBudget = async () => {
    if (!projectId || !company?.id) return;

    await upsertFinances.mutateAsync({
      project_id: projectId,
      company_id: company.id,
      contract_sum: parseFloat(budgetForm.contract_sum) || 0,
      budget_materials: parseFloat(budgetForm.budget_materials) || 0,
      budget_labor: parseFloat(budgetForm.budget_labor) || 0,
      budget_subcontractors: parseFloat(budgetForm.budget_subcontractors) || 0,
      budget_other: parseFloat(budgetForm.budget_other) || 0,
    });

    setBudgetDialogOpen(false);
  };

  const handleSaveCost = async () => {
    if (!projectId || !company?.id) return;

    setIsUploading(true);
    let fileData: { path: string; name: string } | null = null;
    if (costFile) {
      fileData = await uploadFile(costFile, "costs");
      if (!fileData) { setIsUploading(false); return; }
    }

    await createCostEntry.mutateAsync({
      project_id: projectId,
      company_id: company.id,
      category: costForm.category,
      description: costForm.description,
      amount: parseFloat(costForm.amount) || 0,
      date: costForm.date,
      supplier: costForm.supplier || null,
      invoice_number: costForm.invoice_number || null,
      created_by: profile ? `${profile.first_name} ${profile.last_name}` : null,
      ...(fileData ? { file_path: fileData.path, file_name: fileData.name } : {}),
    } as any);

    setIsUploading(false);
    setCostDialogOpen(false);
    setCostFile(null);
    setCostForm({
      category: "materials",
      description: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      supplier: "",
      invoice_number: "",
    });
  };

  const handleSaveInvoice = async () => {
    if (!projectId || !company?.id) return;

    setIsUploading(true);
    let fileData: { path: string; name: string } | null = null;
    if (invoiceFile) {
      fileData = await uploadFile(invoiceFile, "invoices");
      if (!fileData) { setIsUploading(false); return; }
    }

    await createInvoice.mutateAsync({
      project_id: projectId,
      company_id: company.id,
      invoice_number: invoiceForm.invoice_number,
      description: invoiceForm.description || null,
      amount: parseFloat(invoiceForm.amount) || 0,
      invoice_date: invoiceForm.invoice_date,
      due_date: invoiceForm.due_date || null,
      paid_date: null,
      status: invoiceForm.status,
      ...(fileData ? { file_path: fileData.path, file_name: fileData.name } : {}),
    } as any);

    setIsUploading(false);
    setInvoiceDialogOpen(false);
    setInvoiceFile(null);
    setInvoiceForm({
      invoice_number: "",
      description: "",
      amount: "",
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      due_date: "",
      status: "sent",
    });
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    await updateInvoice.mutateAsync({
      id: invoice.id,
      status: "paid",
      paid_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const handleDelete = async () => {
    if (!deleteType) return;
    
    if (deleteType.type === "cost") {
      await deleteCostEntry.mutateAsync(deleteType.id);
    } else {
      await deleteInvoice.mutateAsync(deleteType.id);
    }
    
    setDeleteType(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(value);
  };

  const getCategoryLabel = (category: string) => {
    return COST_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getStatusBadge = (status: string) => {
    const opt = INVOICE_STATUSES.find(s => s.value === status);
    return opt ? <Badge className={opt.color}>{opt.label}</Badge> : null;
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("auto.oekonomioversikt")}</h1>
          <p className="text-muted-foreground">{t("auto.budsjett_kostnader_og_fakturering")}</p>
        </div>
        <Button onClick={handleOpenBudget}>
          <Save className="h-4 w-4 mr-2" />
          {t("auto.rediger_budsjett")}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(totals.totalContract)}</p>
                <p className="text-xs text-muted-foreground">{t("auto.kontraktsum")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(totals.totalActual)}</p>
                <p className="text-xs text-muted-foreground">{t("auto.paaloepte_kostnader")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(totals.totalInvoiced)}</p>
                <p className="text-xs text-muted-foreground">{t("auto.fakturert")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totals.margin >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                <TrendingUp className={`h-5 w-5 ${totals.margin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${totals.margin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(totals.margin)}
                </p>
                <p className="text-xs text-muted-foreground">Margin ({totals.marginPercent.toFixed(1)}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget progress */}
      {totals.totalBudget > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("auto.budsjettforbruk")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Brukt: {formatCurrency(totals.totalActual)}</span>
                <span>Budsjett: {formatCurrency(totals.totalBudget)}</span>
              </div>
              <Progress 
                value={Math.min(totals.budgetUsed, 100)} 
                className={totals.budgetUsed > 100 ? "[&>div]:bg-red-500" : ""} 
              />
              <p className="text-xs text-muted-foreground text-right">
                {totals.budgetUsed.toFixed(1)}% av budsjett
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for costs and invoices */}
      <Tabs defaultValue="costs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="costs">Kostnader ({costEntries.length})</TabsTrigger>
          <TabsTrigger value="invoices">Fakturaer ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrer kostnad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("auto.registrer_kostnad")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t("auto.kategori")}</Label>
                    <Select
                      value={costForm.category}
                      onValueChange={(v) => setCostForm({ ...costForm, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COST_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("auto.beskrivelse_2")}</Label>
                    <Input
                      value={costForm.description}
                      onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                      placeholder={t("auto.hva_gjelder_kostnaden")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("auto.beloep_kr")}</Label>
                      <Input
                        type="number"
                        value={costForm.amount}
                        onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>{t("auto.dato")}</Label>
                      <Input
                        type="date"
                        value={costForm.date}
                        onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("auto.leverandoer")}</Label>
                      <Input
                        value={costForm.supplier}
                        onChange={(e) => setCostForm({ ...costForm, supplier: e.target.value })}
                        placeholder={t("auto.leverandoernavn")}
                      />
                    </div>
                    <div>
                      <Label>{t("auto.fakturanr")}</Label>
                      <Input
                        value={costForm.invoice_number}
                        onChange={(e) => setCostForm({ ...costForm, invoice_number: e.target.value })}
                        placeholder="F-12345"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Vedlegg (faktura-PDF, kvittering, etc.)</Label>
                    <input
                      ref={costFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setCostFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1"
                      onClick={() => costFileRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {costFile ? costFile.name : "Last opp fil"}
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setCostDialogOpen(false); setCostFile(null); }}>
                      {t("auto.avbryt")}
                    </Button>
                    <Button
                      onClick={handleSaveCost}
                      disabled={!costForm.description || !costForm.amount || createCostEntry.isPending || isUploading}
                    >
                      {isUploading ? "Laster opp..." : "Lagre"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {costEntries.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("auto.dato")}</TableHead>
                    <TableHead>{t("auto.kategori")}</TableHead>
                    <TableHead>{t("auto.beskrivelse")}</TableHead>
                    <TableHead>{t("auto.leverandoer")}</TableHead>
                    <TableHead className="text-right">{t("auto.beloep")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(parseISO(entry.date), "d. MMM yyyy", { locale: nb })}</TableCell>
                      <TableCell>{getCategoryLabel(entry.category)}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.supplier || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(entry as any).file_path && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => viewFile((entry as any).file_path)}
                              title={t("auto.vis_vedlegg")}
                            >
                              <Paperclip className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteType({ type: "cost", id: entry.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("auto.ingen_kostnader_registrert")}</h3>
                <p className="text-muted-foreground mb-4">{t("auto.registrer_kostnader_for_aa_foelge_opp_bu")}</p>
                <Button onClick={() => setCostDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrer kostnad
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("auto.ny_faktura")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("auto.ny_faktura")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("auto.fakturanummer")}</Label>
                      <Input
                        value={invoiceForm.invoice_number}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                        placeholder="F-001"
                      />
                    </div>
                    <div>
                      <Label>{t("auto.status_2")}</Label>
                      <Select
                        value={invoiceForm.status}
                        onValueChange={(v) => setInvoiceForm({ ...invoiceForm, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVOICE_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>{t("auto.beskrivelse")}</Label>
                    <Input
                      value={invoiceForm.description}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                      placeholder={t("auto.hva_faktureres")}
                    />
                  </div>
                  <div>
                    <Label>{t("auto.beloep_kr")}</Label>
                    <Input
                      type="number"
                      value={invoiceForm.amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("auto.fakturadato")}</Label>
                      <Input
                        type="date"
                        value={invoiceForm.invoice_date}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>{t("auto.forfallsdato")}</Label>
                      <Input
                        type="date"
                        value={invoiceForm.due_date}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Vedlegg (faktura-PDF)</Label>
                    <input
                      ref={invoiceFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-1"
                      onClick={() => invoiceFileRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {invoiceFile ? invoiceFile.name : "Last opp faktura-fil"}
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setInvoiceDialogOpen(false); setInvoiceFile(null); }}>
                      {t("auto.avbryt")}
                    </Button>
                    <Button
                      onClick={handleSaveInvoice}
                      disabled={!invoiceForm.invoice_number || !invoiceForm.amount || createInvoice.isPending || isUploading}
                    >
                      {isUploading ? "Laster opp..." : "Opprett"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {invoices.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("auto.fakturanr")}</TableHead>
                    <TableHead>{t("auto.beskrivelse")}</TableHead>
                    <TableHead>{t("auto.dato")}</TableHead>
                    <TableHead>{t("auto.forfall")}</TableHead>
                    <TableHead className="text-right">{t("auto.beloep")}</TableHead>
                    <TableHead>{t("auto.status_2")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.description || "-"}</TableCell>
                      <TableCell>{format(parseISO(invoice.invoice_date), "d. MMM yyyy", { locale: nb })}</TableCell>
                      <TableCell>
                        {invoice.due_date ? format(parseISO(invoice.due_date), "d. MMM yyyy", { locale: nb }) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(invoice as any).file_path && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => viewFile((invoice as any).file_path)}
                              title={t("auto.vis_vedlegg")}
                            >
                              <Paperclip className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          {invoice.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkPaid(invoice)}
                              title={t("auto.merk_som_betalt")}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteType({ type: "invoice", id: invoice.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("auto.ingen_fakturaer")}</h3>
                <p className="text-muted-foreground mb-4">{t("auto.opprett_fakturaer_for_aa_foelge_opp_innb")}</p>
                <Button onClick={() => setInvoiceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("auto.ny_faktura")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Budget dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auto.rediger_budsjett")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kontraktsum (kr)</Label>
              <Input
                type="number"
                value={budgetForm.contract_sum}
                onChange={(e) => setBudgetForm({ ...budgetForm, contract_sum: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">{t("auto.budsjett_per_kategori")}</p>
              <div className="space-y-3">
                <div>
                  <Label>{t("auto.materialer")}</Label>
                  <Input
                    type="number"
                    value={budgetForm.budget_materials}
                    onChange={(e) => setBudgetForm({ ...budgetForm, budget_materials: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{t("auto.arbeidskraft")}</Label>
                  <Input
                    type="number"
                    value={budgetForm.budget_labor}
                    onChange={(e) => setBudgetForm({ ...budgetForm, budget_labor: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{t("auto.underleverandoerer")}</Label>
                  <Input
                    type="number"
                    value={budgetForm.budget_subcontractors}
                    onChange={(e) => setBudgetForm({ ...budgetForm, budget_subcontractors: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{t("auto.annet")}</Label>
                  <Input
                    type="number"
                    value={budgetForm.budget_other}
                    onChange={(e) => setBudgetForm({ ...budgetForm, budget_other: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setBudgetDialogOpen(false)}>
                {t("auto.avbryt")}
              </Button>
              <Button onClick={handleSaveBudget} disabled={upsertFinances.isPending}>
                {t("auto.lagre")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteType} onOpenChange={() => setDeleteType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Slett {deleteType?.type === "cost" ? "kostnad" : "faktura"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("auto.er_du_sikker_paa_at_du_vil_slette_handli")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("auto.avbryt")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("auto.slett")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
