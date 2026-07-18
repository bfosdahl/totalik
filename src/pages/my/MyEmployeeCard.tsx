import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, Phone, Mail, Users, FileText, GraduationCap, Edit2, Save, X,
  Plus, Trash2, Download, Upload, CreditCard, Pen, Loader2, Building2, Check, IdCard
} from "lucide-react";
import { toast } from "sonner";
import { Employee, useUpdateEmployee, useEmployeeDocuments, useEmployeeCourses } from "@/hooks/useEmployees";
import { useProfileNextOfKin, useUpdateProfileNextOfKin } from "@/hooks/useProfileNextOfKin";
import { useAuth } from "@/contexts/AuthContext";
import { AddCourseDialog } from "@/components/employees/AddCourseDialog";
import { UploadDocumentDialog } from "@/components/employees/UploadDocumentDialog";
import { HmsCardSection } from "@/components/employees/HmsCardSection";
import { SignatureManager } from "@/components/employees/SignatureManager";
import { format, differenceInDays } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments, useUserDepartments } from "@/hooks/useDepartments";
import { useQuery } from "@tanstack/react-query";

export default function MyEmployeeCard() {
  const { profile, company, user } = useAuth();

  // Fetch current user's full employee profile
  const { data: employee, isLoading } = useQuery({
    queryKey: ["my-employee-card", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, company_id, first_name, last_name, email, phone, avatar_url, is_active, created_at, updated_at, hms_card_required, hms_card_obtained, hms_card_reminder_sent_30_days, hms_card_reminder_sent_7_days, hms_card_reminder_sent_90_days, hms_card_reminder_sent_60_days, is_verneombud, is_hms_responsible, primary_department_id, status, is_assigned_to_main, preferred_language, deleted_at")
        .eq("id", profile.id)
        .single();
      if (error) throw error;
      const { data: sens } = await supabase.rpc("get_profile_sensitive_full", { p_profile_id: profile.id });
      const s = Array.isArray(sens) ? sens[0] : sens;
      return { ...data, ...(s || {}) } as Employee;
    },
    enabled: !!profile?.id,
  });

  if (isLoading || !employee) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={employee.avatar_url || undefined} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary">
              {((employee.first_name?.charAt(0) || "") + (employee.last_name?.charAt(0) || "")).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IdCard className="h-6 w-6 text-primary" />
              Mitt ansattkort
            </h1>
            <p className="text-muted-foreground">
              {employee.first_name} {employee.last_name} • {employee.email}
            </p>
          </div>
        </div>

        <EmployeeCardContent employee={employee} />
      </div>
    </AppLayout>
  );
}

function EmployeeCardContent({ employee }: { employee: Employee }) {
  const { profile, company } = useAuth();
  const { data: nok } = useProfileNextOfKin(employee.id);
  const updateNok = useUpdateProfileNextOfKin();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    phone: employee.phone || "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_relation: "",
  });
  useEffect(() => {
    setEditData((prev) => ({
      ...prev,
      next_of_kin_name: nok?.next_of_kin_name || "",
      next_of_kin_phone: nok?.next_of_kin_phone || "",
      next_of_kin_relation: nok?.next_of_kin_relation || "",
    }));
  }, [nok?.next_of_kin_name, nok?.next_of_kin_phone, nok?.next_of_kin_relation]);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);

  const updateEmployee = useUpdateEmployee();
  const { documents, isLoading: docsLoading, deleteDocument } = useEmployeeDocuments(employee.id);
  const { courses, isLoading: coursesLoading, deleteCourse } = useEmployeeCourses(employee.id);
  const { departments, isLoading: deptsLoading } = useDepartments();
  const { userDepartments, isLoading: userDeptsLoading } = useUserDepartments(employee.id);

  const [isAssignedToMain, setIsAssignedToMain] = useState(true);

  useEffect(() => {
    const fetchMainAssignment = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_assigned_to_main")
        .eq("id", employee.id)
        .single();
      if (data) {
        const profileData = data as typeof data & { is_assigned_to_main?: boolean };
        setIsAssignedToMain(profileData.is_assigned_to_main ?? true);
      }
    };
    if (employee.id) fetchMainAssignment();
  }, [employee.id]);

  const assignedDepartmentIds = userDepartments.map(ud => ud.department_id);

  const handleSave = async () => {
    if (employee.company_id) {
      await updateNok.mutateAsync({
        profileId: employee.id,
        companyId: employee.company_id,
        next_of_kin_name: editData.next_of_kin_name || null,
        next_of_kin_phone: editData.next_of_kin_phone || null,
        next_of_kin_relation: editData.next_of_kin_relation || null,
      });
    }
    updateEmployee.mutate({ id: employee.id, phone: editData.phone }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancel = () => {
    setEditData({
      phone: employee.phone || "",
      next_of_kin_name: nok?.next_of_kin_name || "",
      next_of_kin_phone: nok?.next_of_kin_phone || "",
      next_of_kin_relation: nok?.next_of_kin_relation || "",
    });
    setIsEditing(false);
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .download(filePath);
    if (error) { console.error("Download error:", error); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCourseStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: "Ingen utløp", variant: "secondary" as const };
    const daysUntil = differenceInDays(new Date(expiryDate), new Date());
    if (daysUntil < 0) return { label: "Utgått", variant: "destructive" as const };
    if (daysUntil <= 30) return { label: "Utløper snart", variant: "outline" as const };
    return { label: "Gyldig", variant: "secondary" as const };
  };

  const canManage = true; // Users can always manage their own card

  return (
    <>
      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="info" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Informasjon</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Avdelinger</span>
            <span className="sm:hidden">Avd</span>
          </TabsTrigger>
          <TabsTrigger value="hmscard" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">HMS-kort</span>
            <span className="sm:hidden">HMS</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Dokumenter</span>
            <span className="sm:hidden">Dok</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Kurs</span>
            <span className="sm:hidden">Kurs</span>
          </TabsTrigger>
          <TabsTrigger value="signature" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Pen className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Signatur</span>
            <span className="sm:hidden">Sign</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Kontaktinformasjon</CardTitle>
                <CardDescription>Din personlige informasjon</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rediger
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-post</p>
                    <p>{employee.email || "Ikke angitt"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    {isEditing ? (
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-8"
                      />
                    ) : (
                      <p>{employee.phone || "Ikke angitt"}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pårørende
              </CardTitle>
              <CardDescription>Kontaktperson ved nødstilfeller</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Navn</Label>
                    <Input value={editData.next_of_kin_name} onChange={(e) => setEditData(prev => ({ ...prev, next_of_kin_name: e.target.value }))} placeholder="Navn på pårørende" />
                  </div>
                  <div>
                    <Label>Telefon</Label>
                    <Input value={editData.next_of_kin_phone} onChange={(e) => setEditData(prev => ({ ...prev, next_of_kin_phone: e.target.value }))} placeholder="Telefonnummer" />
                  </div>
                  <div>
                    <Label>Relasjon</Label>
                    <Input value={editData.next_of_kin_relation} onChange={(e) => setEditData(prev => ({ ...prev, next_of_kin_relation: e.target.value }))} placeholder="f.eks. Ektefelle, Forelder" />
                  </div>
                </div>
              ) : (
                <>
                  {nok?.next_of_kin_name ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><p className="text-sm text-muted-foreground">Navn</p><p>{nok.next_of_kin_name}</p></div>
                      <div><p className="text-sm text-muted-foreground">Telefon</p><p>{nok.next_of_kin_phone || "Ikke angitt"}</p></div>
                      <div><p className="text-sm text-muted-foreground">Relasjon</p><p>{nok.next_of_kin_relation || "Ikke angitt"}</p></div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Ingen pårørende registrert</p>
                  )}
                </>
              )}
              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={updateEmployee.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Lagre
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Avbryt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab - View only */}
        <TabsContent value="departments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Avdelingstilhørighet
              </CardTitle>
              <CardDescription>Dine avdelinger</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(deptsLoading || userDeptsLoading) ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Laster avdelinger...
                </div>
              ) : (
                <div className="space-y-2">
                  {isAssignedToMain && (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company?.name || 'Hovedenheten'}</p>
                          <p className="text-sm text-muted-foreground">Hovedenhet</p>
                        </div>
                      </div>
                      <Badge variant="secondary"><Check className="w-3 h-3 mr-1" />Tilhører</Badge>
                    </div>
                  )}
                  {departments.filter(d => d.is_active && assignedDepartmentIds.includes(d.id)).map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          {dept.city && <p className="text-sm text-muted-foreground">{dept.city}</p>}
                        </div>
                      </div>
                      <Badge variant="secondary"><Check className="w-3 h-3 mr-1" />Tilhører</Badge>
                    </div>
                  ))}
                  {!isAssignedToMain && departments.filter(d => d.is_active && assignedDepartmentIds.includes(d.id)).length === 0 && (
                    <p className="text-muted-foreground text-sm">Du er ikke tilordnet noen avdelinger ennå.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HMS Card Tab */}
        <TabsContent value="hmscard" className="space-y-4 mt-4">
          <HmsCardSection employee={employee} canManage={canManage} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Dokumenter</h3>
              <p className="text-sm text-muted-foreground">Dine opplastede dokumenter</p>
            </div>
            <Button onClick={() => setIsUploadDocOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Last opp
            </Button>
          </div>
          {docsLoading ? (
            <p className="text-muted-foreground">Laster dokumenter...</p>
          ) : documents?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ingen dokumenter lastet opp</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents?.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.description || "Ingen beskrivelse"} • Lastet opp {format(new Date(doc.created_at), "d. MMM yyyy", { locale: nb })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadDocument(doc.file_path, doc.file_name)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteDocument.mutate(doc)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Kurs og sertifiseringer</h3>
              <p className="text-sm text-muted-foreground">Oversikt over dine kurs med automatisk varsling ved utløp</p>
            </div>
            <Button onClick={() => setIsAddCourseOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Legg til kurs
            </Button>
          </div>
          {coursesLoading ? (
            <p className="text-muted-foreground">Laster kurs...</p>
          ) : courses?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ingen kurs registrert</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {courses?.map((course) => {
                const status = getCourseStatus(course.expiry_date);
                const isExpiring = course.expiry_date &&
                  differenceInDays(new Date(course.expiry_date), new Date()) <= 30 &&
                  differenceInDays(new Date(course.expiry_date), new Date()) >= 0;
                return (
                  <Card key={course.id} className={isExpiring ? "border-yellow-500" : ""}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          status.variant === "destructive" ? "bg-red-500/10" :
                          status.variant === "outline" ? "bg-yellow-500/10" : "bg-green-500/10"
                        }`}>
                          <GraduationCap className={`w-5 h-5 ${
                            status.variant === "destructive" ? "text-red-500" :
                            status.variant === "outline" ? "text-yellow-500" : "text-green-500"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{course.course_name}</p>
                            <Badge variant={status.variant} className={status.variant === "outline" ? "border-yellow-500 text-yellow-600" : ""}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {course.course_provider && `${course.course_provider} • `}
                            Fullført: {format(new Date(course.completed_date), "d. MMM yyyy", { locale: nb })}
                            {course.expiry_date && ` • Utløper: ${format(new Date(course.expiry_date), "d. MMM yyyy", { locale: nb })}`}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => deleteCourse.mutate(course.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Signature Tab */}
        <TabsContent value="signature" className="space-y-4 mt-4">
          <SignatureManager
            employeeId={employee.id}
            existingSignature={employee.signature_data}
            canManage={true}
            onSignatureUpdated={() => {}}
          />
        </TabsContent>
      </Tabs>

      <AddCourseDialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen} employeeId={employee.id} />
      <UploadDocumentDialog
        open={isUploadDocOpen}
        onOpenChange={setIsUploadDocOpen}
        employeeId={employee.id}
        uploaderName={`${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Ukjent"}
      />
    </>
  );
}
