import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
}

interface ParsedUser {
  email: string;
  firstName: string;
  lastName: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

interface BulkUserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onSuccess: () => void;
}

export function BulkUserImportDialog({
  open,
  onOpenChange,
  companies,
  onSuccess,
}: BulkUserImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "results">("upload");
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [defaultRole, setDefaultRole] = useState<"user" | "company_admin">("user");
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const resetDialog = useCallback(() => {
    setStep("upload");
    setParsedUsers([]);
    setSelectedCompanyId("");
    setDefaultRole("user");
    setImportResults([]);
    setImportProgress(0);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(resetDialog, 300);
  }, [onOpenChange, resetDialog]);

  const downloadTemplate = useCallback(() => {
    const csv = "email,fornavn,etternavn\nola.nordmann@eksempel.no,Ola,Nordmann\nkari.nordmann@eksempel.no,Kari,Nordmann";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bruker-import-mal.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Normalize a header name for flexible matching
  const normalizeHeader = (name: string): string =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\s]+/g, " ").trim();

  // Find column index by checking multiple aliases (exact → startsWith → includes)
  const findColIndex = (headers: string[], aliases: string[]): number => {
    const norm = headers.map(normalizeHeader);
    const normAliases = aliases.map(normalizeHeader);
    for (const a of normAliases) { const i = norm.indexOf(a); if (i !== -1) return i; }
    for (const a of normAliases) { const i = norm.findIndex(h => h.startsWith(a)); if (i !== -1) return i; }
    for (const a of normAliases) { const i = norm.findIndex(h => h.includes(a)); if (i !== -1) return i; }
    return -1;
  };

  // Parse a single CSV line respecting quoted fields
  const parseCSVLine = (line: string, delim: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delim && !inQuotes) { values.push(current.trim()); current = ""; }
      else current += ch;
    }
    values.push(current.trim());
    return values.map(v => v.replace(/^["']|["']$/g, ""));
  };

  // Auto-detect delimiter from first few lines
  const detectDelimiter = (lines: string[]): string => {
    const sample = lines.slice(0, 5).join("\n");
    const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
    for (const ch of sample) { if (ch in counts) counts[ch]++; }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const parseCSV = useCallback((content: string): ParsedUser[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const delim = detectDelimiter(lines);
    const headers = parseCSVLine(lines[0], delim);

    // Flexible column matching with many aliases
    const emailIndex = findColIndex(headers, ["email", "e-post", "epost", "customer_email", "e_post", "mail"]);
    const firstNameIndex = findColIndex(headers, ["fornavn", "first_name", "firstname", "customer_name", "navn"]);
    const lastNameIndex = findColIndex(headers, ["etternavn", "last_name", "lastname", "customer_secondname", "customer_second_name"]);
    const phoneIndex = findColIndex(headers, ["telefon", "phone", "cellphone", "customer_cellphone", "customer_phone", "mobil"]);
    const companyColIndex = findColIndex(headers, ["customer_company", "bedrift", "firma", "company"]);

    if (emailIndex === -1) {
      return [{ email: "", firstName: "", lastName: "", valid: false, error: "CSV mangler e-post-kolonne" }];
    }

    const users: ParsedUser[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seenEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line, delim);
      const rawEmail = values[emailIndex]?.trim().toLowerCase() || "";
      const firstName = firstNameIndex !== -1 ? values[firstNameIndex]?.trim() || "" : "";
      const lastName = lastNameIndex !== -1 ? values[lastNameIndex]?.trim() || "" : "";
      const phone = phoneIndex !== -1 ? values[phoneIndex]?.trim() || "" : "";
      const companyName = companyColIndex !== -1 ? values[companyColIndex]?.trim() || "" : "";

      let valid = true;
      let error: string | undefined;
      let email = rawEmail;

      if (!email) {
        valid = false;
        error = "Mangler e-post";
      } else if (!emailRegex.test(email)) {
        valid = false;
        // Show helpful context: what was in the field + phone if available
        const hint = phone ? ` (tlf: ${phone})` : "";
        error = `Ugyldig e-postformat: "${rawEmail}"${hint}`;
      } else if (seenEmails.has(email)) {
        valid = false;
        error = "Duplikat e-post";
      } else {
        seenEmails.add(email);
      }

      users.push({ email: emailRegex.test(email) ? email : rawEmail, firstName, lastName, valid, error });
    }

    return users;
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({ title: "Feil", description: "Vennligst last opp en CSV-fil", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const users = parseCSV(content);
      setParsedUsers(users);
      if (users.length > 0 && !users[0].error?.includes("CSV mangler")) {
        setStep("preview");
      } else {
        toast({ 
          title: "Feil i CSV-fil", 
          description: users[0]?.error || "Kunne ikke parse CSV-filen", 
          variant: "destructive" 
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }, [parseCSV, toast]);

  const handleImport = useCallback(async () => {
    if (!selectedCompanyId) {
      toast({ title: "Velg bedrift", description: "Du må velge en bedrift for brukerne", variant: "destructive" });
      return;
    }

    const validUsers = parsedUsers.filter(u => u.valid);
    if (validUsers.length === 0) {
      toast({ title: "Ingen gyldige brukere", description: "Det er ingen gyldige brukere å importere", variant: "destructive" });
      return;
    }

    setStep("importing");
    setImportProgress(10);

    try {
      const usersToCreate = validUsers.map(u => ({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        companyId: selectedCompanyId,
        role: defaultRole,
      }));

      setImportProgress(30);

      const { data, error } = await supabase.functions.invoke("bulk-create-users", {
        body: { users: usersToCreate },
      });

      setImportProgress(90);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setImportResults(data.results || []);
      setImportProgress(100);
      setStep("results");

      if (data.summary) {
        toast({
          title: "Import fullført",
          description: `${data.summary.success} av ${data.summary.total} brukere ble opprettet`,
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Import error:", error);
      toast({ title: "Importfeil", description: error.message, variant: "destructive" });
      setStep("preview");
    }
  }, [selectedCompanyId, parsedUsers, defaultRole, toast, onSuccess]);

  const validCount = parsedUsers.filter(u => u.valid).length;
  const invalidCount = parsedUsers.filter(u => !u.valid).length;
  const successCount = importResults.filter(r => r.success).length;
  const failedCount = importResults.filter(r => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Importer brukere fra CSV"}
            {step === "preview" && "Forhåndsvisning av import"}
            {step === "importing" && "Importerer brukere..."}
            {step === "results" && "Importresultat"}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Last opp en CSV-fil med brukere. Filen må inneholde minst en e-post-kolonne.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <label className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Velg CSV-fil
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Last ned mal
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">CSV-format</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Filen må ha en header-rad med kolonnenavn. Støttede kolonner:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li><code className="bg-muted px-1 rounded">email</code> eller <code className="bg-muted px-1 rounded">e-post</code> (påkrevd)</li>
                <li><code className="bg-muted px-1 rounded">fornavn</code> eller <code className="bg-muted px-1 rounded">first_name</code></li>
                <li><code className="bg-muted px-1 rounded">etternavn</code> eller <code className="bg-muted px-1 rounded">last_name</code></li>
              </ul>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{parsedUsers.length} totalt</Badge>
              <Badge variant="success">{validCount} gyldige</Badge>
              {invalidCount > 0 && <Badge variant="destructive">{invalidCount} ugyldige</Badge>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedrift *</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg bedrift" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Standard rolle</Label>
                <Select value={defaultRole} onValueChange={(v) => setDefaultRole(v as "user" | "company_admin")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Bruker</SelectItem>
                    <SelectItem value="company_admin">Bedriftsadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Navn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {user.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <span className="text-xs text-destructive">{user.error}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>
                        {user.firstName || user.lastName 
                          ? `${user.firstName} ${user.lastName}`.trim() 
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Tilbake
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0 || !selectedCompanyId}
              >
                Importer {validCount} brukere
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-4">
            <Progress value={importProgress} className="w-full" />
            <p className="text-center text-muted-foreground">
              Oppretter brukere... Vennligst vent.
            </p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{successCount} opprettet</Badge>
              {failedCount > 0 && <Badge variant="destructive">{failedCount} feilet</Badge>}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Melding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{result.email}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <span className="text-green-600">Opprettet</span>
                        ) : (
                          <span className="text-destructive">{result.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Lukk</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
