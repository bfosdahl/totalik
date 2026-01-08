import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeeCourses } from "@/hooks/useEmployees";
import { addYears, format } from "date-fns";
import { FileText, Upload, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

const COMMON_COURSES = [
  { name: "Varme arbeider", validityYears: 5 },
  { name: "Førstehjelpskurs", validityYears: 2 },
  { name: "HMS-kurs for ledere", validityYears: 0 },
  { name: "Truckkurs (T1)", validityYears: 0 },
  { name: "Truckkurs (T2)", validityYears: 0 },
  { name: "Truckkurs (T4)", validityYears: 0 },
  { name: "Fallsikring", validityYears: 0 },
  { name: "Arbeid i høyden", validityYears: 0 },
  { name: "Asbest", validityYears: 5 },
  { name: "El-sikkerhet", validityYears: 0 },
  { name: "Brannvern", validityYears: 0 },
  { name: "Stillas", validityYears: 0 },
  { name: "Lift/personløfter", validityYears: 0 },
  { name: "Annet", validityYears: 0 },
];

export function AddCourseDialog({ open, onOpenChange, employeeId }: AddCourseDialogProps) {
  const { addCourse } = useEmployeeCourses(employeeId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    course_name: "",
    course_provider: "",
    certificate_number: "",
    completed_date: format(new Date(), "yyyy-MM-dd"),
    validity_years: "",
    notes: "",
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleCourseSelect = (courseName: string) => {
    const course = COMMON_COURSES.find(c => c.name === courseName);
    setFormData(prev => ({
      ...prev,
      course_name: courseName === "Annet" ? "" : courseName,
      validity_years: course?.validityYears ? String(course.validityYears) : "",
    }));
  };

  const parseFileWithAI = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("parse-course-certificate", {
        body: {
          fileBase64: base64,
          fileName: file.name,
          fileType: file.type,
        },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const parsed = data.data;
        
        // Update form with parsed data
        setFormData(prev => ({
          ...prev,
          course_name: parsed.course_name || prev.course_name,
          course_provider: parsed.course_provider || prev.course_provider,
          certificate_number: parsed.certificate_number || prev.certificate_number,
          completed_date: parsed.completed_date || prev.completed_date,
          validity_years: parsed.validity_years ? String(parsed.validity_years) : prev.validity_years,
          notes: parsed.notes || prev.notes,
        }));

        toast.success("Kursbevis analysert! Feltene er fylt ut automatisk.");
      } else {
        setParseError("Kunne ikke lese dokumentet. Vennligst fyll inn manuelt.");
      }
    } catch (err) {
      console.error("Parse error:", err);
      setParseError("Feil ved analyse av dokumentet. Vennligst fyll inn manuelt.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Filen er for stor. Maks 10MB.");
        return;
      }
      setCertificateFile(file);
      
      // Automatically parse the file with AI
      await parseFileWithAI(file);
    }
  };

  const removeFile = () => {
    setCertificateFile(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validityYears = formData.validity_years ? parseInt(formData.validity_years) : undefined;
    const expiryDate = validityYears && validityYears > 0
      ? format(addYears(new Date(formData.completed_date), validityYears), "yyyy-MM-dd")
      : undefined;

    addCourse.mutate({
      course_name: formData.course_name,
      course_provider: formData.course_provider || undefined,
      certificate_number: formData.certificate_number || undefined,
      certificate_file: certificateFile || undefined,
      completed_date: formData.completed_date,
      expiry_date: expiryDate,
      validity_years: validityYears,
      notes: formData.notes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          course_name: "",
          course_provider: "",
          certificate_number: "",
          completed_date: format(new Date(), "yyyy-MM-dd"),
          validity_years: "",
          notes: "",
        });
        setCertificateFile(null);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Legg til kurs</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Velg kurs</Label>
            <Select onValueChange={handleCourseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Velg fra liste..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_COURSES.map(course => (
                  <SelectItem key={course.name} value={course.name}>
                    {course.name}
                    {course.validityYears > 0 && ` (${course.validityYears} år)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_name">Kursnavn *</Label>
            <Input
              id="course_name"
              value={formData.course_name}
              onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
              placeholder="Navn på kurset"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course_provider">Kursleverandør</Label>
              <Input
                id="course_provider"
                value={formData.course_provider}
                onChange={(e) => setFormData(prev => ({ ...prev, course_provider: e.target.value }))}
                placeholder="f.eks. Norsk Brannvernforening"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate_number">Sertifikatnummer</Label>
              <Input
                id="certificate_number"
                value={formData.certificate_number}
                onChange={(e) => setFormData(prev => ({ ...prev, certificate_number: e.target.value }))}
                placeholder="Valgfritt"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completed_date">Fullført dato *</Label>
              <Input
                id="completed_date"
                type="date"
                value={formData.completed_date}
                onChange={(e) => setFormData(prev => ({ ...prev, completed_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity_years">Gyldighet (år)</Label>
              <Input
                id="validity_years"
                type="number"
                min="0"
                max="20"
                value={formData.validity_years}
                onChange={(e) => setFormData(prev => ({ ...prev, validity_years: e.target.value }))}
                placeholder="0 = ingen utløp"
              />
            </div>
          </div>

          {/* Certificate Upload with AI Parsing */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Last opp kursbevis
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" />
                AI-analyse
              </span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Last opp kursbeviset så fyller vi ut feltene automatisk
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {isParsing ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium">Analyserer kursbevis...</p>
                  <p className="text-xs text-muted-foreground">Dette kan ta noen sekunder</p>
                </div>
              ) : certificateFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 bg-muted/50 rounded-md p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-8 w-8 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{certificateFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(certificateFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {parseError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{parseError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center py-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Klikk for å laste opp</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG (maks 10MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                disabled={isParsing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Eventuelle notater..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={addCourse.isPending || isParsing}>
              {addCourse.isPending ? "Lagrer..." : "Legg til"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}