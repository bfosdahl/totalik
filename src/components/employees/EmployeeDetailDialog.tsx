import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Phone, 
  Mail, 
  Users, 
  FileText, 
  GraduationCap, 
  Edit2, 
  Save, 
  X,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Upload,
  CreditCard,
  Pen,
  Key,
  Loader2,
  Building2,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { Employee, useUpdateEmployee, useEmployeeDocuments, useEmployeeCourses } from "@/hooks/useEmployees";
import { useProfileNextOfKin, useUpdateProfileNextOfKin } from "@/hooks/useProfileNextOfKin";
import { useAuth } from "@/contexts/AuthContext";
import { AddCourseDialog } from "./AddCourseDialog";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { HmsCardSection } from "./HmsCardSection";
import { SignatureManager } from "./SignatureManager";
import { format, differenceInDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments, useUserDepartments } from "@/hooks/useDepartments";
import { useQueryClient } from "@tanstack/react-query";

interface EmployeeDetailDialogProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}

export function EmployeeDetailDialog({ 
  employee, 
  open, 
  onOpenChange,
  canManage 
}: EmployeeDetailDialogProps) {
  const { profile, company } = useAuth();
  const queryClient = useQueryClient();
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
  const [newPassword, setNewPassword] = useState("");
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);

  const updateEmployee = useUpdateEmployee();

  const handleSendWelcomeEmail = async () => {
    if (!employee.email) {
      toast.error("Ansatt mangler e-postadresse");
      return;
    }
    setIsSendingWelcome(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-single-welcome-email", {
        body: { email: employee.email },
      });
      if (error) {
        const msg = (error as any).context?.error || error.message || "Kunne ikke sende velkomstmail";
        toast.error(msg);
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success(`Velkomstmail sendt til ${employee.email}. Passord er satt til Abc_1234.`);
    } catch (err) {
      console.error("Send welcome email error:", err);
      toast.error("En feil oppstod ved sending av velkomstmail");
    } finally {
      setIsSendingWelcome(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Passordet må være minst 6 tegn");
      return;
    }

    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: {
          userId: employee.user_id,
          newPassword,
          sendEmail: sendPasswordEmail,
        },
      });

      if (error) {
        const errorMessage = error.context?.error || error.message || "Kunne ikke endre passord";
        toast.error(errorMessage);
        return;
      }

      toast.success(data.emailSent 
        ? "Passord oppdatert og sendt på e-post" 
        : "Passord oppdatert"
      );
      setNewPassword("");
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error("En feil oppstod ved endring av passord");
    } finally {
      setIsResettingPassword(false);
    }
  };
  const { documents, isLoading: docsLoading, deleteDocument } = useEmployeeDocuments(employee.id);
  const { courses, isLoading: coursesLoading, deleteCourse } = useEmployeeCourses(employee.id);
  
  // Department management
  const { departments, isLoading: deptsLoading } = useDepartments();
  const { userDepartments, isLoading: userDeptsLoading, assignUserToDepartment, removeUserFromDepartment, refetch: refetchUserDepts } = useUserDepartments(employee.id);
  const [assigningDept, setAssigningDept] = useState<string | null>(null);
  const [isAssigningMain, setIsAssigningMain] = useState(false);
  
  // Get IDs of departments the user is already in
  const assignedDepartmentIds = userDepartments.map(ud => ud.department_id);
  
  // Check if user is assigned to main company
  const [isAssignedToMain, setIsAssignedToMain] = useState(true);
  
  // Fetch is_assigned_to_main status
  useEffect(() => {
    const fetchMainAssignment = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", employee.id)
        .single();
      
      if (data) {
        // Use type assertion since is_assigned_to_main was recently added
        const profileData = data as typeof data & { is_assigned_to_main?: boolean };
        setIsAssignedToMain(profileData.is_assigned_to_main ?? true);
      }
    };
    
    if (employee.id && open) {
      fetchMainAssignment();
    }
  }, [employee.id, open]);

  const getInitials = () => {
    const first = employee.first_name?.charAt(0) || "";
    const last = employee.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

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
    updateEmployee.mutate({
      id: employee.id,
      phone: editData.phone,
    }, {
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

    if (error) {
      console.error("Download error:", error);
      return;
    }

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={employee.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {employee.first_name} {employee.last_name}
                </h2>
                <p className="text-muted-foreground font-normal">{employee.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-4">
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
                    <CardDescription>Personlig informasjon om ansatt</CardDescription>
                  </div>
                  {canManage && !isEditing && (
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
                        <Input
                          value={editData.next_of_kin_name}
                          onChange={(e) => setEditData(prev => ({ ...prev, next_of_kin_name: e.target.value }))}
                          placeholder="Navn på pårørende"
                        />
                      </div>
                      <div>
                        <Label>Telefon</Label>
                        <Input
                          value={editData.next_of_kin_phone}
                          onChange={(e) => setEditData(prev => ({ ...prev, next_of_kin_phone: e.target.value }))}
                          placeholder="Telefonnummer"
                        />
                      </div>
                      <div>
                        <Label>Relasjon</Label>
                        <Input
                          value={editData.next_of_kin_relation}
                          onChange={(e) => setEditData(prev => ({ ...prev, next_of_kin_relation: e.target.value }))}
                          placeholder="f.eks. Ektefelle, Forelder"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {nok?.next_of_kin_name ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Navn</p>
                            <p>{nok.next_of_kin_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Telefon</p>
                            <p>{nok.next_of_kin_phone || "Ikke angitt"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Relasjon</p>
                            <p>{nok.next_of_kin_relation || "Ikke angitt"}</p>
                          </div>
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

              {canManage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Endre passord
                    </CardTitle>
                    <CardDescription>Sett nytt passord for denne ansatte</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nytt passord</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minst 6 tegn"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={handleResetPassword} 
                          disabled={isResettingPassword || !newPassword}
                        >
                          {isResettingPassword ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4 mr-2" />
                          )}
                          Endre passord
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sendEmail" 
                        checked={sendPasswordEmail}
                        onCheckedChange={(checked) => setSendPasswordEmail(checked as boolean)}
                      />
                      <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
                        Send nytt passord på e-post til ansatt
                      </Label>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Send velkomstmail på nytt</p>
                          <p className="text-xs text-muted-foreground">
                            Tilbakestiller passord til <code className="px-1 py-0.5 rounded bg-muted">Abc_1234</code> og sender e-post med innloggingsinfo.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleSendWelcomeEmail}
                          disabled={isSendingWelcome || !employee.email}
                        >
                          {isSendingWelcome ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4 mr-2" />
                          )}
                          Send velkomstmail
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Avdelingstilhørighet
                  </CardTitle>
                  <CardDescription>
                    Velg hvilke enheter denne ansatte skal tilhøre
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(deptsLoading || userDeptsLoading) ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Laster avdelinger...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Hovedenheten (Main Company) */}
                      <div 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isAssignedToMain ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isAssignedToMain ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Building2 className={`w-4 h-4 ${isAssignedToMain ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{company?.name || 'Hovedenheten'}</p>
                            <p className="text-sm text-muted-foreground">Hovedenhet</p>
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            variant={isAssignedToMain ? "outline" : "default"}
                            size="sm"
                            disabled={isAssigningMain}
                            onClick={async () => {
                              setIsAssigningMain(true);
                              try {
                                // Toggle is_assigned_to_main flag
                                const newValue = !isAssignedToMain;
                                const { error } = await supabase
                                  .from("profiles")
                                  .update({ is_assigned_to_main: newValue } as any)
                                  .eq("id", employee.id);
                                
                                if (error) throw error;
                                setIsAssignedToMain(newValue);
                                queryClient.invalidateQueries({ queryKey: ["my-employee-card"] });
                                toast.success(isAssignedToMain ? "Fjernet fra hovedenheten" : "Lagt til i hovedenheten");
                              } catch (err) {
                                console.error("Error updating main company assignment:", err);
                                toast.error("Kunne ikke oppdatere tilhørighet");
                              } finally {
                                setIsAssigningMain(false);
                              }
                            }}
                          >
                            {isAssigningMain ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isAssignedToMain ? (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Fjern
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Legg til
                              </>
                            )}
                          </Button>
                        )}
                        {!canManage && isAssignedToMain && (
                          <Badge variant="secondary">
                            <Check className="w-3 h-3 mr-1" />
                            Tilhører
                          </Badge>
                        )}
                      </div>

                      {/* Avdelinger (Departments) */}
                      {departments.filter(d => d.is_active).map((dept) => {
                        const isAssigned = assignedDepartmentIds.includes(dept.id);
                        const isProcessing = assigningDept === dept.id;
                        
                        return (
                          <div 
                            key={dept.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isAssigned ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isAssigned ? 'bg-primary/10' : 'bg-muted'}`}>
                                <Building2 className={`w-4 h-4 ${isAssigned ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div>
                                <p className="font-medium">{dept.name}</p>
                                {dept.city && (
                                  <p className="text-sm text-muted-foreground">{dept.city}</p>
                                )}
                              </div>
                            </div>
                            {canManage && (
                              <Button
                                variant={isAssigned ? "outline" : "default"}
                                size="sm"
                                disabled={isProcessing}
                                onClick={async () => {
                                  setAssigningDept(dept.id);
                                  try {
                                    if (isAssigned) {
                                      await removeUserFromDepartment(employee.id, dept.id);
                                    } else {
                                      await assignUserToDepartment(employee.id, dept.id, false);
                                    }
                                    await refetchUserDepts();
                                    queryClient.invalidateQueries({ queryKey: ["my-employee-card"] });
                                  } finally {
                                    setAssigningDept(null);
                                  }
                                }}
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isAssigned ? (
                                  <>
                                    <X className="w-4 h-4 mr-1" />
                                    Fjern
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Legg til
                                  </>
                                )}
                              </Button>
                            )}
                            {!canManage && isAssigned && (
                              <Badge variant="secondary">
                                <Check className="w-3 h-3 mr-1" />
                                Tilhører
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      
                      {departments.filter(d => d.is_active).length === 0 && (
                        <p className="text-sm text-muted-foreground py-2">
                          Ingen avdelinger er opprettet ennå. Gå til Innstillinger → Avdelinger for å opprette avdelinger.
                        </p>
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
                  <p className="text-sm text-muted-foreground">
                    Last opp og administrer dokumenter for denne ansatte
                  </p>
                </div>
                {canManage && (
                  <Button onClick={() => setIsUploadDocOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Last opp
                  </Button>
                )}
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {canManage && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteDocument.mutate(doc)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
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
                  <p className="text-sm text-muted-foreground">
                    Oversikt over kurs med automatisk varsling ved utløp
                  </p>
                </div>
                {canManage && (
                  <Button onClick={() => setIsAddCourseOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Legg til kurs
                  </Button>
                )}
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
                              status.variant === "outline" ? "bg-yellow-500/10" :
                              "bg-green-500/10"
                            }`}>
                              <GraduationCap className={`w-5 h-5 ${
                                status.variant === "destructive" ? "text-red-500" :
                                status.variant === "outline" ? "text-yellow-500" :
                                "text-green-500"
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{course.course_name}</p>
                                <Badge 
                                  variant={status.variant}
                                  className={status.variant === "outline" ? "border-yellow-500 text-yellow-600" : ""}
                                >
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
                          {canManage && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteCourse.mutate(course.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
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
                canManage={canManage || employee.id === profile?.id}
                onSignatureUpdated={() => {
                  // Trigger refetch by closing and reopening could work,
                  // but for now just show success message
                }}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AddCourseDialog
        open={isAddCourseOpen}
        onOpenChange={setIsAddCourseOpen}
        employeeId={employee.id}
      />

      <UploadDocumentDialog
        open={isUploadDocOpen}
        onOpenChange={setIsUploadDocOpen}
        employeeId={employee.id}
        uploaderName={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Ukjent"}
      />
    </>
  );
}