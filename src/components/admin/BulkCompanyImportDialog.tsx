import { useState } from "react";
import { Upload, FileSpreadsheet, Check, X, AlertCircle, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { applyDefaultHmsSetup } from "@/lib/applyDefaultHmsSetup";
import * as XLSX from "xlsx";

interface ParsedCompany {
  orgNumber: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  contactFirstName: string;
  contactLastName: string;
  isValid: boolean;
  errorMessage?: string;
  isDuplicate?: boolean;
}

interface ImportResult {
  orgNumber: string;
  name: string;
  success: boolean;
  message: string;
  userCreated?: boolean;
  userEmail?: string;
}

interface BulkCompanyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MODULE_OPTIONS = [
  { type: "IK_HMS", name: "IK HMS" },
  { type: "IK_MAT", name: "IK MAT" },
  { type: "IK_BYGG", name: "KS Bygg" },
];

export function BulkCompanyImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkCompanyImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "results">("upload");
  const [parsedCompanies, setParsedCompanies] = useState<ParsedCompany[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>(["IK_HMS"]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [existingOrgNumbers, setExistingOrgNumbers] = useState<Set<string>>(new Set());
  const [createUsers, setCreateUsers] = useState(true);

  const resetDialog = () => {
    setStep("upload");
    setParsedCompanies([]);
    setSelectedModules(["IK_HMS"]);
    setImportResults([]);
    setImportProgress(0);
    setExistingOrgNumbers(new Set());
    setCreateUsers(true);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const toggleModuleSelection = (moduleType: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleType)
        ? prev.filter((m) => m !== moduleType)
        : [...prev, moduleType]
    );
  };

  const parseExcelFile = async (file: File): Promise<ParsedCompany[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Get existing companies to check for duplicates
          const { data: existingCompanies } = await supabase
            .from("companies")
            .select("org_number");
          
          const existingOrgs = new Set(
            existingCompanies?.map((c) => c.org_number?.replace(/\s/g, "")) || []
          );
          setExistingOrgNumbers(existingOrgs);

          // Parse and deduplicate by org number
          const seenOrgNumbers = new Set<string>();
          const companies: ParsedCompany[] = [];

          for (const row of jsonData as any[]) {
            const orgNumber = String(row.Customer_OrgNumber || row["Customer_OrgNumber"] || "").replace(/\s/g, "");
            const name = String(row.Customer_Company || row["Customer_Company"] || "").trim();
            
            // Skip if no org number or company name
            if (!orgNumber || !name) continue;
            
            // Skip if we've already seen this org number in the file
            if (seenOrgNumbers.has(orgNumber)) continue;
            seenOrgNumbers.add(orgNumber);

            // Build address from components
            const addressParts = [
              row.Customer_Adress || row["Customer_Adress"] || "",
              row.Customer_HouseNumber || row["Customer_HouseNumber"] || "",
              row.Customer_HouseLetter || row["Customer_HouseLetter"] || "",
            ].filter(Boolean);
            const address = addressParts.join(" ").trim();

            const postalCode = String(row.Customer_ZipCode || row["Customer_ZipCode"] || "").trim();
            const city = String(row.Customer_PostalArea || row["Customer_PostalArea"] || "").trim();
            const email = String(row.Customer_Email || row["Customer_Email"] || "").trim().replace(/\\/g, "");
            const phone = String(row.Customer_Phone || row.Customer_CellPhone || row["Customer_Phone"] || row["Customer_CellPhone"] || "").trim();
            const contactFirstName = String(row.Customer_Name || row["Customer_Name"] || "").trim();
            const contactLastName = String(row.Customer_SecondName || row["Customer_SecondName"] || "").trim();

            const isDuplicate = existingOrgs.has(orgNumber);
            const isValid = orgNumber.length >= 9 && name.length > 0 && !isDuplicate;
            
            let errorMessage: string | undefined;
            if (isDuplicate) {
              errorMessage = "Finnes allerede";
            } else if (orgNumber.length < 9) {
              errorMessage = "Ugyldig org.nr";
            } else if (!name) {
              errorMessage = "Mangler navn";
            }

            companies.push({
              orgNumber,
              name,
              address,
              postalCode,
              city,
              email,
              phone,
              contactFirstName,
              contactLastName,
              isValid,
              isDuplicate,
              errorMessage,
            });
          }

          resolve(companies);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const companies = await parseExcelFile(file);
      if (companies.length === 0) {
        toast.error("Ingen gyldige bedrifter funnet i filen");
        return;
      }
      setParsedCompanies(companies);
      setStep("preview");
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Kunne ikke lese filen. Sjekk at det er en gyldig Excel-fil.");
    }
  };

  const handleImport = async () => {
    const validCompanies = parsedCompanies.filter((c) => c.isValid);
    if (validCompanies.length === 0) {
      toast.error("Ingen gyldige bedrifter å importere");
      return;
    }

    setStep("importing");
    const results: ImportResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validCompanies.length; i++) {
      const company = validCompanies[i];
      setImportProgress(Math.round(((i + 1) / validCompanies.length) * 100));

      try {
        // 1. Create the company
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: company.name,
            org_number: company.orgNumber,
            address: company.address || null,
            postal_code: company.postalCode || null,
            city: company.city || null,
            email: company.email || null,
            phone: company.phone || null,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // 2. Create modules
        for (const moduleType of selectedModules) {
          await supabase.from("company_modules").insert({
            company_id: newCompany.id,
            module_type: moduleType,
            is_active: true,
            settings: {},
          });

          // Create seed projects for KS Bygg
          if (moduleType === "IK_BYGG") {
            const { createSeedProjects } = await import("@/utils/ksModule2SeedProjects");
            await createSeedProjects(newCompany.id);
          }
        }

        // 3. Apply default HMS setup if IK_HMS is selected
        if (selectedModules.includes("IK_HMS")) {
          await applyDefaultHmsSetup(newCompany.id);
        }

        // 4. Create company admin user if enabled and email exists
        let userCreated = false;
        let userEmail = "";
        let userCreateError: string | undefined;
        if (createUsers && company.email) {
          try {
            const { data: inviteData, error: userError } = await supabase.functions.invoke("invite-user", {
              body: {
                email: company.email,
                firstName: company.contactFirstName || "",
                lastName: company.contactLastName || "",
                role: "company_admin",
                companyId: newCompany.id,
              },
            });

            if (userError) {
              userCreateError = userError.message;
            } else if (inviteData?.error) {
              userCreateError = inviteData.error;
            } else {
              userCreated = true;
              userEmail = company.email;
            }
          } catch (userErr) {
            console.error("Failed to create user:", userErr);
            userCreateError = userErr instanceof Error ? userErr.message : "Ukjent feil ved brukeropprettelse";
            // Don't fail the whole import if user creation fails
          }
        }

        successCount++;
        results.push({
          orgNumber: company.orgNumber,
          name: company.name,
          success: true,
          message: userCreated
            ? `Opprettet + bruker (${userEmail})`
            : userCreateError
              ? `Opprettet (bruker feilet: ${userCreateError})`
              : "Opprettet",
          userCreated,
          userEmail,
        });
      } catch (error: any) {
        failCount++;
        results.push({
          orgNumber: company.orgNumber,
          name: company.name,
          success: false,
          message: error.message || "Ukjent feil",
        });
      }
    }

    setImportResults(results);
    setStep("results");

    if (successCount > 0) {
      toast.success(`${successCount} bedrifter importert`);
      onSuccess?.();
    }
    if (failCount > 0) {
      toast.error(`${failCount} bedrifter feilet`);
    }
  };

  const validCount = parsedCompanies.filter((c) => c.isValid).length;
  const invalidCount = parsedCompanies.filter((c) => !c.isValid).length;
  const duplicateCount = parsedCompanies.filter((c) => c.isDuplicate).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Masseimport av bedrifter
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Last opp Excel-fil fra Nextcom eller lignende system
              </p>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Velg fil
                  </span>
                </Button>
              </Label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Forventede kolonner:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Customer_OrgNumber - Organisasjonsnummer</li>
                <li>• Customer_Company - Bedriftsnavn</li>
                <li>• Customer_Adress, Customer_HouseNumber - Adresse</li>
                <li>• Customer_ZipCode, Customer_PostalArea - Postnr/Sted</li>
                <li>• Customer_Email - E-post</li>
                <li>• Customer_Phone/Customer_CellPhone - Telefon</li>
              </ul>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Summary */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="success" className="text-sm">
                <Check className="w-3 h-3 mr-1" />
                {validCount} gyldige
              </Badge>
              {duplicateCount > 0 && (
                <Badge variant="secondary" className="text-sm">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {duplicateCount} duplikater
                </Badge>
              )}
              {invalidCount - duplicateCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <X className="w-3 h-3 mr-1" />
                  {invalidCount - duplicateCount} ugyldige
                </Badge>
              )}
            </div>

            {/* Module selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Moduler for nye bedrifter</Label>
              <div className="flex gap-4 flex-wrap">
                {MODULE_OPTIONS.map((module) => (
                  <div key={module.type} className="flex items-center gap-2">
                    <Checkbox
                      id={`bulk-${module.type}`}
                      checked={selectedModules.includes(module.type)}
                      onCheckedChange={() => toggleModuleSelection(module.type)}
                    />
                    <Label htmlFor={`bulk-${module.type}`} className="text-sm cursor-pointer">
                      {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* User creation option */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="create-users"
                checked={createUsers}
                onCheckedChange={(checked) => setCreateUsers(checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="create-users" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Opprett bedriftsadmin for hver bedrift
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bruker e-post og kontaktperson fra Excel-filen. Brukere får tilsendt innloggingslenke.
                </p>
              </div>
            </div>

            {/* Companies table */}
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Org.nr</TableHead>
                    <TableHead>Bedrift</TableHead>
                    <TableHead className="hidden md:table-cell">Kontakt</TableHead>
                    <TableHead className="hidden lg:table-cell">E-post</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedCompanies.map((company, index) => (
                    <TableRow
                      key={index}
                      className={company.isValid ? "" : "opacity-60 bg-muted/30"}
                    >
                      <TableCell>
                        {company.isValid ? (
                          <Badge variant="success" className="text-xs">
                            <Check className="w-3 h-3" />
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            {company.errorMessage || "Ugyldig"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {company.orgNumber}
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[180px] truncate">
                        {company.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[120px] truncate">
                        {[company.contactFirstName, company.contactLastName].filter(Boolean).join(" ") || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[180px] truncate">
                        {company.email || <span className="text-amber-500 text-xs">Mangler</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between gap-4 pt-2">
              <Button variant="outline" onClick={resetDialog}>
                Avbryt
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importer {validCount} bedrifter
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Importerer bedrifter...</p>
              <p className="text-sm text-muted-foreground">
                {importProgress}% ferdig
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {step === "results" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Summary */}
            <div className="flex gap-3">
              <Badge variant="success" className="text-sm">
                <Check className="w-3 h-3 mr-1" />
                {importResults.filter((r) => r.success).length} vellykket
              </Badge>
              {importResults.filter((r) => !r.success).length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  <X className="w-3 h-3 mr-1" />
                  {importResults.filter((r) => !r.success).length} feilet
                </Badge>
              )}
            </div>

            {/* Results table */}
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Org.nr</TableHead>
                    <TableHead>Bedrift</TableHead>
                    <TableHead>Melding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {result.success ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <X className="w-4 h-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {result.orgNumber}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {result.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.message}
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
