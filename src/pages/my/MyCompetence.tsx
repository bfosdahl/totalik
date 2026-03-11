import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeCourse } from "@/hooks/useEmployees";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Award,
  Plus,
  Upload,
  FileText,
  Download,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Building2,
  Hash,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export default function MyCompetence() {
  const { profile, company } = useAuth();
  const queryClient = useQueryClient();
  const [courses, setCourses] = useState<EmployeeCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<EmployeeCourse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [courseName, setCourseName] = useState("");
  const [courseProvider, setCourseProvider] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [validityYears, setValidityYears] = useState("");
  const [notes, setNotes] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const fetchCourses = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("employee_courses")
      .select("*")
      .eq("employee_id", profile.id)
      .order("completed_date", { ascending: false });

    if (!error && data) {
      setCourses(data as EmployeeCourse[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [profile?.id]);

  const resetForm = () => {
    setCourseName("");
    setCourseProvider("");
    setCertificateNumber("");
    setCompletedDate("");
    setExpiryDate("");
    setValidityYears("");
    setNotes("");
    setCertificateFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getCourseStatus = (course: EmployeeCourse) => {
    if (!course.expiry_date) {
      return { label: "Gyldig", variant: "default" as const, icon: CheckCircle2, color: "text-green-600" };
    }
    const expiryDate = new Date(course.expiry_date);
    const daysLeft = differenceInDays(expiryDate, new Date());
    if (isPast(expiryDate)) {
      return { label: "Utløpt", variant: "destructive" as const, icon: XCircle, color: "text-destructive" };
    }
    if (daysLeft <= 30) {
      return { label: `${daysLeft} dager`, variant: "secondary" as const, icon: AlertTriangle, color: "text-amber-600" };
    }
    return { label: "Gyldig", variant: "default" as const, icon: CheckCircle2, color: "text-green-600" };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertificateFile(file);

    // Try AI parsing
    if (file.type.includes("pdf") || file.type.includes("image")) {
      setIsParsing(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const { data, error } = await supabase.functions.invoke("parse-course-certificate", {
            body: { fileBase64: base64, fileName: file.name, fileType: file.type },
          });

          if (!error && data?.data) {
            const d = data.data;
            if (d.course_name && !courseName) setCourseName(d.course_name);
            if (d.course_provider && !courseProvider) setCourseProvider(d.course_provider);
            if (d.certificate_number && !certificateNumber) setCertificateNumber(d.certificate_number);
            if (d.completed_date && !completedDate) setCompletedDate(d.completed_date);
            if (d.validity_years && !validityYears) setValidityYears(String(d.validity_years));
            if (d.notes && !notes) setNotes(d.notes);

            // Calculate expiry date
            if (d.completed_date && d.validity_years && !expiryDate) {
              const completed = new Date(d.completed_date);
              completed.setFullYear(completed.getFullYear() + d.validity_years);
              setExpiryDate(format(completed, "yyyy-MM-dd"));
            }

            toast({ title: "Kursbevis analysert", description: "Feltene er fylt ut automatisk fra dokumentet." });
          }
          setIsParsing(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setIsParsing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!courseName || !completedDate || !profile?.id || !company?.id) return;
    setIsSaving(true);

    try {
      let certificate_file_path: string | undefined;

      if (certificateFile) {
        const safeName = certificateFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${company.id}/${profile.id}/${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("course-certificates")
          .upload(filePath, certificateFile);
        if (uploadError) throw uploadError;
        certificate_file_path = filePath;
      }

      const { error } = await supabase.from("employee_courses").insert({
        company_id: company.id,
        employee_id: profile.id,
        course_name: courseName,
        course_provider: courseProvider || null,
        certificate_number: certificateNumber || null,
        completed_date: completedDate,
        expiry_date: expiryDate || null,
        validity_years: validityYears ? parseInt(validityYears) : null,
        notes: notes || null,
        certificate_file_path,
      });

      if (error) throw error;

      toast({ title: "Kurs registrert!" });
      resetForm();
      setAddDialogOpen(false);
      fetchCourses();
      queryClient.invalidateQueries({ queryKey: ["employee-courses"] });
    } catch (error: any) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    try {
      // Delete certificate file if exists
      if (selectedCourse.certificate_file_path) {
        await supabase.storage.from("course-certificates").remove([selectedCourse.certificate_file_path]);
      }
      const { error } = await supabase.from("employee_courses").delete().eq("id", selectedCourse.id);
      if (error) throw error;
      toast({ title: "Kurs slettet" });
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error: any) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    }
  };

  const openCertificate = async (filePath: string) => {
    const { data } = await supabase.storage.from("course-certificates").createSignedUrl(filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleSendCertificates = async () => {
    if (!sendEmail.trim()) return;

    // Generate list of certificate URLs
    const certUrls: { name: string; url: string }[] = [];
    for (const course of courses) {
      if (course.certificate_file_path) {
        const { data } = await supabase.storage
          .from("course-certificates")
          .createSignedUrl(course.certificate_file_path, 86400); // 24h
        if (data?.signedUrl) {
          certUrls.push({ name: course.course_name, url: data.signedUrl });
        }
      }
    }

    // Build mailto link with course overview
    const subject = `Kompetansedokumentasjon - ${profile?.first_name} ${profile?.last_name}`;
    const body = [
      `Hei,`,
      ``,
      `Her er en oversikt over mine kurs og sertifikater:`,
      ``,
      ...courses.map((c, i) => {
        const status = getCourseStatus(c);
        const cert = certUrls.find(cu => cu.name === c.course_name);
        return `${i + 1}. ${c.course_name}${c.course_provider ? ` (${c.course_provider})` : ""} - Fullført: ${format(new Date(c.completed_date), "dd.MM.yyyy")}${c.expiry_date ? ` - Utløper: ${format(new Date(c.expiry_date), "dd.MM.yyyy")}` : ""} - Status: ${status.label}${cert ? `\n   Kursbevis: ${cert.url}` : ""}`;
      }),
      ``,
      `Med vennlig hilsen`,
      `${profile?.first_name} ${profile?.last_name}`,
      company?.name || "",
    ].join("\n");

    window.open(`mailto:${sendEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setSendDialogOpen(false);
    setSendEmail("");
    toast({ title: "E-postklient åpnet", description: "Kursbevisene er klare til å sendes." });
  };

  const validCount = courses.filter(c => !c.expiry_date || !isPast(new Date(c.expiry_date))).length;
  const expiredCount = courses.filter(c => c.expiry_date && isPast(new Date(c.expiry_date))).length;

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Min kompetanse
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Dine kurs, sertifikater og opplæring
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSendDialogOpen(true)} disabled={courses.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send bevis
            </Button>
            <Button onClick={() => { resetForm(); setAddDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Registrer kurs
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{courses.length}</p>
              <p className="text-xs text-muted-foreground">Totalt</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{validCount}</p>
              <p className="text-xs text-muted-foreground">Gyldige</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
              <p className="text-xs text-muted-foreground">Utløpt</p>
            </CardContent>
          </Card>
        </div>

        {/* Course list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Laster kurs...
          </div>
        ) : courses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
              <h3 className="font-medium text-lg">Ingen kurs registrert</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                Registrer dine kurs og sertifikater for enkel dokumentasjon
              </p>
              <Button onClick={() => { resetForm(); setAddDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Registrer ditt første kurs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => {
              const status = getCourseStatus(course);
              const StatusIcon = status.icon;
              return (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          status.variant === "destructive" ? "bg-destructive/10" : 
                          status.variant === "secondary" ? "bg-amber-100 dark:bg-amber-900/30" : 
                          "bg-green-100 dark:bg-green-900/30"
                        }`}>
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-sm">{course.course_name}</h3>
                            {course.course_provider && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" />
                                {course.course_provider}
                              </p>
                            )}
                          </div>
                          <Badge variant={status.variant} className="shrink-0 text-[10px]">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Fullført: {format(new Date(course.completed_date), "dd.MM.yyyy")}
                          </span>
                          {course.expiry_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Utløper: {format(new Date(course.expiry_date), "dd.MM.yyyy")}
                            </span>
                          )}
                          {course.certificate_number && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {course.certificate_number}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {course.certificate_file_path && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCertificate(course.certificate_file_path!)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { setSelectedCourse(course); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add course dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Registrer kurs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File upload with AI parsing */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Last opp kursbevis
              </Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {isParsing && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Analyserer kursbevis med AI...
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Last opp PDF eller bilde – AI fyller ut feltene automatisk
              </p>
            </div>

            <div className="space-y-2">
              <Label>Kursnavn *</Label>
              <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="F.eks. Varme arbeider" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kursleverandør</Label>
                <Input value={courseProvider} onChange={(e) => setCourseProvider(e.target.value)} placeholder="F.eks. Norsk Brannvernforening" />
              </div>
              <div className="space-y-2">
                <Label>Sertifikatnummer</Label>
                <Input value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)} placeholder="Valgfritt" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fullført dato *</Label>
                <Input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Utløpsdato</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gyldighet (år)</Label>
              <Input type="number" value={validityYears} onChange={(e) => setValidityYears(e.target.value)} placeholder="F.eks. 5" />
            </div>

            <div className="space-y-2">
              <Label>Notater</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Eventuelle notater" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={!courseName || !completedDate || isSaving}>
              {isSaving ? "Lagrer..." : "Lagre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kurs</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{selectedCourse?.course_name}"? Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send certificates dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send kursbevis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send en oversikt over dine kurs og sertifikater til en mottaker via e-post. 
              Eventuelle opplastede kursbevis inkluderes som lenker.
            </p>
            <div className="space-y-2">
              <Label>Mottakers e-postadresse</Label>
              <Input
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="mottaker@eksempel.no"
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-2">Følgende sendes:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {courses.map((c) => (
                  <li key={c.id} className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    {c.course_name}
                    {c.certificate_file_path && <FileText className="h-3 w-3 text-primary ml-1" />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleSendCertificates} disabled={!sendEmail.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Åpne e-post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
