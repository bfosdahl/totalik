import { useState, useRef } from "react";
import { Upload, FlaskConical, Building2, MapPin, FileText, AlertTriangle, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { GlobalChemicalSearch } from "./GlobalChemicalSearch";
import { 
  useGlobalChemicalRegistry, 
  useCompanyChemicals, 
  GlobalChemicalWithSds 
} from "@/hooks/useGlobalChemicalRegistry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";

interface AddChemicalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const DANGER_CLASSES = [
  "Brannfarlig",
  "Oksiderende",
  "Eksplosiv",
  "Giftig",
  "Etsende",
  "Irriterende",
  "Helseskadelig",
  "Miljøskadelig",
  "Gass under trykk",
];

const getDangerClassColor = (dangerClass: string): string => {
  const classColors: Record<string, string> = {
    "Brannfarlig": "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200",
    "Oksiderende": "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200",
    "Eksplosiv": "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",
    "Giftig": "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
    "Etsende": "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200",
    "Irriterende": "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
    "Helseskadelig": "bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200",
    "Miljøskadelig": "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
    "Gass under trykk": "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
  };
  return classColors[dangerClass] || "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200";
};

export const AddChemicalDialog = ({
  open,
  onOpenChange,
  projectId,
}: AddChemicalDialogProps) => {
  const [activeTab, setActiveTab] = useState<"search" | "new">("search");
  const [selectedChemical, setSelectedChemical] = useState<GlobalChemicalWithSds | null>(null);
  
  // Form state for adding existing chemical
  const [location, setLocation] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [quantity, setQuantity] = useState("");

  // Form state for new chemical
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [casNumber, setCasNumber] = useState("");
  const [dangerClasses, setDangerClasses] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [sdsFile, setSdsFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: companyChemicals = [] } = useCompanyChemicals(projectId);
  const { 
    addExistingChemical, 
    createNewChemical, 
    isAdding, 
    isCreating 
  } = useGlobalChemicalRegistry(projectId);

  // Get IDs of chemicals already in company registry
  const existingChemicalIds = companyChemicals.map(c => c.global_chemical_id);

  const resetForm = () => {
    setActiveTab("search");
    setSelectedChemical(null);
    setLocation("");
    setCustomNotes("");
    setQuantity("");
    setProductName("");
    setManufacturer("");
    setCasNumber("");
    setDangerClasses([]);
    setNotes("");
    setSdsFile(null);
  };

  const handleSelectChemical = (chemical: GlobalChemicalWithSds) => {
    setSelectedChemical(chemical);
  };

  const handleAddExisting = () => {
    if (!selectedChemical) return;

    addExistingChemical({
      globalChemicalId: selectedChemical.id,
      location: location || undefined,
      customNotes: customNotes || undefined,
      quantity: quantity || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      }
    });
  };

  const handleCreateNew = () => {
    if (!productName.trim()) {
      toast.error(t("auto.produktnavn_er_paakrevd"));
      return;
    }

    createNewChemical({
      productName: productName.trim(),
      manufacturer: manufacturer.trim() || undefined,
      casNumber: casNumber.trim() || undefined,
      dangerClasses,
      notes: notes.trim() || undefined,
      sdsFile: sdsFile || undefined,
      location: location.trim() || undefined,
      customNotes: customNotes.trim() || undefined,
      quantity: quantity.trim() || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      }
    });
  };

  const toggleDangerClass = (dc: string) => {
    setDangerClasses(prev => 
      prev.includes(dc) 
        ? prev.filter(c => c !== dc)
        : [...prev, dc]
    );
  };

  const handleSdsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error(t("auto.kun_pdf_filer_er_stoettet"));
      return;
    }

    setSdsFile(file);

    // Parse SDS using AI
    setIsParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t("auto.du_maa_vaere_logget_inn"));
          setIsParsing(false);
          return;
        }

        const response = await supabase.functions.invoke("parse-sds-pdf", {
          body: { pdfBase64: base64, fileName: file.name },
        });

        if (response.error) {
          console.error("SDS parse error:", response.error);
          toast.error(t("auto.kunne_ikke_lese_sikkerhetsdatabladet_aut"));
        } else if (response.data?.success) {
          const parsed = response.data.data;
          if (parsed.product_name) setProductName(parsed.product_name);
          if (parsed.manufacturer) setManufacturer(parsed.manufacturer);
          if (parsed.danger_classes?.length) setDangerClasses(parsed.danger_classes);
          if (parsed.notes) setNotes(parsed.notes);
          toast.success(t("auto.sikkerhetsdatablad_analysert"));
        }
        setIsParsing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("SDS parse error:", error);
      toast.error(t("auto.feil_ved_lesing_av_sikkerhetsdatablad"));
      setIsParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Legg til stoff i stoffkartoteket
          </DialogTitle>
          <DialogDescription>
            {t("auto.soek_i_det_globale_registeret_eller_oppr")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "search" | "new")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">{t("auto.soek_i_register")}</TabsTrigger>
            <TabsTrigger value="new">{t("auto.opprett_nytt")}</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            {selectedChemical ? (
              // Show selected chemical details
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedChemical.product_name}</h3>
                        {selectedChemical.manufacturer && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {selectedChemical.manufacturer}
                          </p>
                        )}
                        {selectedChemical.cas_number && (
                          <p className="text-xs font-mono mt-1 bg-muted px-2 py-0.5 rounded inline-block">
                            CAS: {selectedChemical.cas_number}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedChemical(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {selectedChemical.danger_classes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {selectedChemical.danger_classes.map((dc, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className={getDangerClassColor(dc)}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {dc}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {selectedChemical.current_sds && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                        <FileText className="h-4 w-4" />
                        Sikkerhetsdatablad tilgjengelig
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Bedriftsspesifikk informasjon (valgfritt)</h4>
                  
                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor="location">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Lagringssted
                      </Label>
                      <Input
                        id="location"
                        placeholder={t("auto.f_eks_kjemikalskap_a_lager_2")}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="quantity">{t("auto.mengde")}</Label>
                      <Input
                        id="quantity"
                        placeholder={t("auto.f_eks_5_liter_2_kg")}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="customNotes">{t("auto.egne_notater")}</Label>
                      <Textarea
                        id="customNotes"
                        placeholder={t("auto.lokale_risikovurderinger_bruksanvisninge")}
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedChemical(null)}>
                    {t("auto.velg_annet_stoff")}
                  </Button>
                  <Button onClick={handleAddExisting} disabled={isAdding}>
                    {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Legg til i kartotek
                  </Button>
                </div>
              </div>
            ) : (
              // Show search interface
              <GlobalChemicalSearch
                onSelectChemical={handleSelectChemical}
                onCreateNew={(query) => {
                  setProductName(query);
                  setActiveTab("new");
                }}
                excludeIds={existingChemicalIds}
              />
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            {/* SDS Upload with AI parsing */}
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {isParsing ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Last opp sikkerhetsdatablad (SDS)</p>
                      <p className="text-sm text-muted-foreground">
                        {isParsing 
                          ? "Analyserer sikkerhetsdatablad..." 
                          : sdsFile 
                            ? sdsFile.name 
                            : "Vi fyller ut skjemaet automatisk fra PDF"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                  >
                    {sdsFile ? "Endre fil" : "Velg fil"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleSdsFileChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form fields */}
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName" className="required">{t("auto.produktnavn")}</Label>
                  <Input
                    id="productName"
                    placeholder={t("auto.f_eks_zalo_oppvaskmiddel")}
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer">{t("auto.produsent_leverandoer")}</Label>
                  <Input
                    id="manufacturer"
                    placeholder={t("auto.f_eks_lilleborg_as")}
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="casNumber">{t("auto.cas_nummer")}</Label>
                <Input
                  id="casNumber"
                  placeholder={t("auto.f_eks_7732_18_5")}
                  value={casNumber}
                  onChange={(e) => setCasNumber(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("auto.unikt_identifikasjonsnummer_fra_chemical")}
                </p>
              </div>

              <div>
                <Label>{t("auto.fareklasser")}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DANGER_CLASSES.map((dc) => (
                    <Badge
                      key={dc}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all",
                        dangerClasses.includes(dc) 
                          ? getDangerClassColor(dc) + " ring-2 ring-offset-1"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleDangerClass(dc)}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {dc}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t("auto.notater_fra_sds")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("auto.foerstehjelpstiltak_lagringsanvisninger_")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium text-sm mb-3">Bedriftsspesifikk informasjon (valgfritt)</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newLocation">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      Lagringssted
                    </Label>
                    <Input
                      id="newLocation"
                      placeholder={t("auto.f_eks_kjemikalskap_a")}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newQuantity">{t("auto.mengde")}</Label>
                    <Input
                      id="newQuantity"
                      placeholder={t("auto.f_eks_5_liter")}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("auto.avbryt")}
              </Button>
              <Button 
                onClick={handleCreateNew} 
                disabled={isCreating || !productName.trim()}
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Opprett og legg til
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
