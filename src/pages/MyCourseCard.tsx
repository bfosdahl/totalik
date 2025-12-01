import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Award, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Building2,
  User,
  Shield,
  QrCode
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { EmployeeCourse } from "@/hooks/useEmployees";

interface HmsCardInfo {
  hms_card_obtained: boolean | null;
  hms_card_number: string | null;
  hms_card_expiry_date: string | null;
}

export default function MyCourseCard() {
  const { user, profile, company } = useAuth();
  const [courses, setCourses] = useState<EmployeeCourse[]>([]);
  const [hmsCard, setHmsCard] = useState<HmsCardInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!profile?.id) return;
      
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("employee_courses")
        .select("*")
        .eq("employee_id", profile.id)
        .order("expiry_date", { ascending: true, nullsFirst: false });

      if (!coursesError && coursesData) {
        setCourses(coursesData as EmployeeCourse[]);
      }

      // Fetch HMS card info from profiles
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
      return { status: "valid", label: "Gyldig", variant: "default" as const, icon: CheckCircle2 };
    }
    
    const expiryDate = new Date(course.expiry_date);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    
    if (isPast(expiryDate)) {
      return { status: "expired", label: "Utløpt", variant: "destructive" as const, icon: XCircle };
    }
    
    if (daysUntilExpiry <= 30) {
      return { status: "expiring", label: `Utløper om ${daysUntilExpiry} dager`, variant: "secondary" as const, icon: AlertTriangle };
    }
    
    return { status: "valid", label: "Gyldig", variant: "default" as const, icon: CheckCircle2 };
  };

  const validCourses = courses.filter(c => {
    if (!c.expiry_date) return true;
    return !isPast(new Date(c.expiry_date));
  });

  const expiredCourses = courses.filter(c => {
    if (!c.expiry_date) return false;
    return isPast(new Date(c.expiry_date));
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Laster kursbevis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4 pb-24">
      {/* Digital ID Card */}
      <Card className="max-w-md mx-auto overflow-hidden shadow-xl border-2 border-primary/20">
        {/* Card Header with gradient */}
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary-foreground/30 shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-2xl font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-primary-foreground/80">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">{company?.name || "Ukjent bedrift"}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-primary-foreground/80">
                <User className="h-4 w-4" />
                <span className="text-sm">{profile?.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Card Stats */}
        <div className="grid grid-cols-2 gap-0 border-b">
          <div className="p-4 text-center border-r">
            <div className="text-3xl font-bold text-primary">{validCourses.length}</div>
            <div className="text-xs text-muted-foreground">Gyldige kurs</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-3xl font-bold text-muted-foreground">{courses.length}</div>
            <div className="text-xs text-muted-foreground">Totalt registrert</div>
          </div>
        </div>

        {/* Course List */}
        <CardContent className="p-0">
          <div className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Shield className="h-4 w-4" />
              <span>Registrerte kurs og sertifikater</span>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Ingen kurs registrert ennå</p>
            </div>
          ) : (
            <div className="divide-y">
              {courses.map((course) => {
                const status = getCourseStatus(course);
                const StatusIcon = status.icon;
                
                return (
                  <div key={course.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium truncate">{course.course_name}</span>
                        </div>
                        {course.course_provider && (
                          <div className="text-xs text-muted-foreground mt-1 ml-6">
                            {course.course_provider}
                          </div>
                        )}
                        {course.certificate_number && (
                          <div className="text-xs text-muted-foreground mt-1 ml-6">
                            Sert.nr: {course.certificate_number}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Fullført: {format(new Date(course.completed_date), "d. MMM yyyy", { locale: nb })}
                            </span>
                          </div>
                          {course.expiry_date && (
                            <div className="flex items-center gap-1">
                              <span>
                                Utløper: {format(new Date(course.expiry_date), "d. MMM yyyy", { locale: nb })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={status.variant}
                        className="shrink-0 flex items-center gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-xs">{status.label}</span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Card Footer */}
        <div className="p-4 bg-muted/30 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <QrCode className="h-4 w-4" />
              <span>ID: {profile?.id?.slice(0, 8).toUpperCase()}</span>
            </div>
            <div>
              Oppdatert: {format(new Date(), "d. MMM yyyy", { locale: nb })}
            </div>
          </div>
        </div>
      </Card>

      {/* Verification Notice */}
      <div className="max-w-md mx-auto mt-4 p-4 bg-muted/50 rounded-lg text-center">
        <p className="text-xs text-muted-foreground">
          Dette digitale kursbeviset er utstedt av {company?.name || "bedriften"} via Athena HMS.
          For verifisering, kontakt bedriften direkte.
        </p>
      </div>

      {/* HMS Card Section (if applicable) */}
      {hmsCard?.hms_card_obtained && (
        <Card className="max-w-md mx-auto mt-4 overflow-hidden">
          <CardHeader className="bg-green-600 text-white p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h3 className="font-bold">HMS-kort</h3>
                <p className="text-sm opacity-90">Registrert i Arbeidstilsynets register</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              {hmsCard.hms_card_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kortnummer:</span>
                  <span className="font-medium">{hmsCard.hms_card_number}</span>
                </div>
              )}
              {hmsCard.hms_card_expiry_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gyldig til:</span>
                  <span className="font-medium">
                    {format(new Date(hmsCard.hms_card_expiry_date), "d. MMMM yyyy", { locale: nb })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
