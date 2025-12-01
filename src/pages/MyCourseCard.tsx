import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Award, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Shield,
  FileText,
  ExternalLink
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { EmployeeCourse } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";

interface HmsCardInfo {
  hms_card_obtained: boolean | null;
  hms_card_number: string | null;
  hms_card_expiry_date: string | null;
}

export default function MyCourseCard() {
  const { profile, company } = useAuth();
  const [courses, setCourses] = useState<EmployeeCourse[]>([]);
  const [hmsCard, setHmsCard] = useState<HmsCardInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!profile?.id) return;
      
      const { data: coursesData, error: coursesError } = await supabase
        .from("employee_courses")
        .select("*")
        .eq("employee_id", profile.id)
        .order("expiry_date", { ascending: true, nullsFirst: false });

      if (!coursesError && coursesData) {
        setCourses(coursesData as EmployeeCourse[]);
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("hms_card_obtained, hms_card_number, hms_card_expiry_date")
        .eq("id", profile.id)
        .single();

      if (!profileError && profileData) {
        setHmsCard(profileData as HmsCardInfo);
      }

      setIsLoading(false);
    };

    fetchMyCourses();
  }, [profile?.id]);

  const getInitials = () => {
    const first = profile?.first_name?.[0] || "";
    const last = profile?.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getCourseStatus = (course: EmployeeCourse) => {
    if (!course.expiry_date) {
      return { status: "valid", label: "Gyldig", color: "bg-green-500", icon: CheckCircle2 };
    }
    
    const expiryDate = new Date(course.expiry_date);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    
    if (isPast(expiryDate)) {
      return { status: "expired", label: "Utløpt", color: "bg-red-500", icon: XCircle };
    }
    
    if (daysUntilExpiry <= 30) {
      return { status: "expiring", label: `${daysUntilExpiry}d`, color: "bg-amber-500", icon: AlertTriangle };
    }
    
    return { status: "valid", label: "Gyldig", color: "bg-green-500", icon: CheckCircle2 };
  };

  const validCourses = courses.filter(c => {
    if (!c.expiry_date) return true;
    return !isPast(new Date(c.expiry_date));
  });

  const openCertificate = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("course-certificates")
      .createSignedUrl(filePath, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Laster kompetansebevis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background p-4 pb-24">
      {/* Main Competence Card - ID Card Style */}
      <div className="max-w-md mx-auto">
        <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-border/50">
          {/* Top decorative pattern */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-50" />
          <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden">
            <svg className="w-full h-full opacity-10" viewBox="0 0 400 100">
              <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-primary" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#pattern)" />
            </svg>
          </div>

          {/* Card Header */}
          <div className="relative px-6 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Kompetansebevis</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">NORGE</span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="relative px-6 py-4 flex gap-5">
            {/* Photo */}
            <div className="shrink-0">
              <Avatar className="h-24 w-20 rounded-lg border-2 border-border shadow-md">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-muted text-xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-medium">1. Etternavn / Surname</p>
                <p className="text-sm font-semibold truncate">{profile?.last_name || "-"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-medium">2. Fornavn / Given name</p>
                <p className="text-sm font-semibold truncate">{profile?.first_name || "-"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-medium">3. Arbeidsgiver / Employer</p>
                <p className="text-sm font-semibold truncate">{company?.name || "-"}</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-3 bg-muted/30 border-y border-border/50">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{validCourses.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Gyldige kurs</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{courses.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Totalt</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center flex flex-col items-center">
                {hmsCard?.hms_card_obtained ? (
                  <>
                    <Shield className="h-6 w-6 text-green-600" />
                    <p className="text-[10px] text-muted-foreground uppercase">HMS-kort</p>
                  </>
                ) : (
                  <>
                    <Shield className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground uppercase">Ingen HMS</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Courses List */}
          <div className="px-6 py-4">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">
              Registrerte kurs og sertifikater
            </p>
            
            {courses.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Ingen kurs registrert</p>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course, index) => {
                  const status = getCourseStatus(course);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div 
                      key={course.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
                    >
                      <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{course.course_name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>
                            {format(new Date(course.completed_date), "dd.MM.yyyy")}
                          </span>
                          {course.expiry_date && (
                            <>
                              <span>→</span>
                              <span>
                                {format(new Date(course.expiry_date), "dd.MM.yyyy")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {course.certificate_file_path && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openCertificate(course.certificate_file_path!)}
                          >
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <div className={`w-7 h-7 rounded-full ${status.color} flex items-center justify-center`}>
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-muted/20 border-t border-border/30">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>ID: {profile?.id?.slice(0, 8).toUpperCase()}</span>
              <span>Oppdatert: {format(new Date(), "dd.MM.yyyy")}</span>
            </div>
          </div>

          {/* Bottom decorative line */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary" />
        </div>

        {/* HMS Card (if obtained) */}
        {hmsCard?.hms_card_obtained && (
          <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl shadow-lg overflow-hidden border border-green-200/50 dark:border-green-800/50">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">HMS-kort</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">Arbeidstilsynets register</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {hmsCard.hms_card_number && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Kortnummer</p>
                    <p className="font-medium">{hmsCard.hms_card_number}</p>
                  </div>
                )}
                {hmsCard.hms_card_expiry_date && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Gyldig til</p>
                    <p className="font-medium">
                      {format(new Date(hmsCard.hms_card_expiry_date), "dd.MM.yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Notice */}
        <div className="mt-4 p-4 bg-muted/30 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">
            Dette digitale kompetansebeviset er utstedt av {company?.name || "bedriften"} via Athena HMS.
            For verifisering, kontakt bedriften direkte.
          </p>
        </div>
      </div>
    </div>
  );
}