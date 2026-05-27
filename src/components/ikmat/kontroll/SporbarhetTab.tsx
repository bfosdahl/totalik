import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Package, Calendar, Thermometer, Download, QrCode, Printer } from "lucide-react";
import { generateIkMatLabelPdf } from "@/utils/ikMatLabelPdf";
import { useAuth } from "@/contexts/AuthContext";
import { useIkMatTraceability, TraceabilityRecord } from "@/hooks/useIkMatTraceability";
import { NewTraceabilityDialog } from "@/components/ikmat/NewTraceabilityDialog";
import { VaremottakQRCodeDialog } from "@/components/ikmat/VaremottakQRCodeDialog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

function DocumentDownloadButton({ 
  documentPath, 
  getDocumentUrl 
}: { 
  documentPath: string; 
  getDocumentUrl: (path: string | null) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getDocumentUrl(documentPath).then(setUrl);
  }, [documentPath, getDocumentUrl]);

  if (!url) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Dokument
      </a>
    </Button>
  );
}

function RecordCard({ 
  record, 
  getDocumentUrl 
}: { 
  record: TraceabilityRecord; 
  getDocumentUrl: (path: string | null) => Promise<string | null>;
}) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-3 sm:pt-6 sm:p-6">
        {/* Mobile layout */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{record.product_name}</p>
                <p className="text-xs text-muted-foreground truncate">{record.supplier_name}</p>
              </div>
            </div>
            {record.receipt_temperature && (
              <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
                <Thermometer className="h-3 w-3" />
                {record.receipt_temperature}°C
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">{record.batch_number || "Ingen batch"}</span>
            <span>{format(new Date(record.receipt_date), "dd.MM.yy", { locale: nb })}</span>
            {record.expiry_date && (
              <span>Utl: {format(new Date(record.expiry_date), "dd.MM.yy")}</span>
            )}
          </div>
          
          {record.allergens && record.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.allergens.map((a) => (
                <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateIkMatLabelPdf(record)}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Merkelapp
            </Button>
            {record.document_path && (
              <DocumentDownloadButton
                documentPath={record.document_path}
                getDocumentUrl={getDocumentUrl}
              />
            )}
          </div>
          
          {record.notes && (
            <p className="text-xs text-muted-foreground border-t pt-2">
              {record.notes}
            </p>
          )}
        </div>
        
        {/* Desktop layout */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-start gap-2 mb-1">
                <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{record.product_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {record.supplier_name}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Batch-nummer</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {record.batch_number || "Ikke oppgitt"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Mottaksdato</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(record.receipt_date), "dd. MMM yyyy", { locale: nb })}
                  </p>
                  {record.expiry_date && (
                    <p className="text-xs text-muted-foreground">
                      Utløper: {format(new Date(record.expiry_date), "dd.MM.yyyy")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              {record.receipt_temperature && (
                <Badge variant="outline" className="gap-1">
                  <Thermometer className="h-3 w-3" />
                  {record.receipt_temperature}°C
                </Badge>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateIkMatLabelPdf(record)}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Merkelapp
                </Button>
                {record.document_path && (
                  <DocumentDownloadButton
                    documentPath={record.document_path}
                    getDocumentUrl={getDocumentUrl}
                  />
                )}
              </div>
            </div>
          </div>

          {record.notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Merknader:</span> {record.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const SporbarhetTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const { records, isLoading, getDocumentUrl } = useIkMatTraceability(profile?.company_id);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "ny") {
      setIsDialogOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredRecords = records.filter((record) => {
    const search = searchQuery.toLowerCase();
    return (
      record.product_name.toLowerCase().includes(search) ||
      record.supplier_name.toLowerCase().includes(search) ||
      (record.batch_number?.toLowerCase() || "").includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">
            Registrer og dokumenter varemottak for sporbarhet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsQrDialogOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">QR-kode</span>
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nytt varemottak
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Søk i mottaksregistre</CardTitle>
          <CardDescription>
            Søk på produktnavn, leverandør eller batch-nummer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk på batch-nummer, produkt eller leverandør..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">
          Mottakshistorikk ({filteredRecords.length})
        </h2>

        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {searchQuery
                ? "Ingen mottak funnet med det søket"
                : "Ingen varemottak registrert ennå"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRecords.map((record) => (
              <RecordCard 
                key={record.id} 
                record={record} 
                getDocumentUrl={getDocumentUrl} 
              />
            ))}
          </div>
        )}
      </div>

      <NewTraceabilityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
      <VaremottakQRCodeDialog
        open={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
      />
    </div>
  );
};
