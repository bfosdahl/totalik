import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, GraduationCap, FileText, AlertCircle, ChevronRight, CreditCard, IdCard, UserPlus, Mail, Eye, EyeOff, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeDetailDialog } from "@/components/employees/EmployeeDetailDialog";
import { format, differenceInDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { t } from "@/i18n/t";
import { BulkMessageDialog } from "@/components/hr/BulkMessageDialog";

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isCompanyAdmin, isSystemAdmin, company } = useAuth();
  const { employees, courses, isLoading } = useEmployees();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkMessageOpen, setBulkMessageOpen] = useState(false);
  const [createDirectDialogOpen, setCreateDirectDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [isInviting, setIsInviting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user"
  });
  const [isCreating, setIsCreating] = useState(false);

  const canManage = isCompanyAdmin || isSystemAdmin;

  const filteredEmployees = employees?.filter(emp => 
    emp.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate expiring courses
  const expiringCourses = courses?.filter(course => {
    if (!course.expiry_date) return false;
    const daysUntilExpiry = differenceInDays(new Date(course.expiry_date), new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }) || [];

  const expiredCourses = courses?.filter(course => {
    if (!course.expiry_date) return false;
    return isPast(new Date(course.expiry_date));
  }) || [];

  // Calculate HMS card stats
  const hmsCardIssues = employees?.filter(emp => {
    if (!emp.hms_card_required) return false;
    if (!emp.hms_card_obtained) return true;
    if (emp.hms_card_expiry_date && isPast(new Date(emp.hms_card_expiry_date))) return true;
    if (emp.hms_card_expiry_date && differenceInDays(new Date(emp.hms_card_expiry_date), new Date()) <= 30) return true;
    return false;
  }) || [];

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const selectedEmployee = employees?.find(e => e.id === selectedEmployeeId);

  const handleInviteUser = async () => {
    if (!inviteEmail || !company?.id) return;
    
    setIsInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: inviteEmail,
          companyId: company.id,
          role: inviteRole
        }
      });

      if (error) {
        let errorMessage = "Kunne ikke sende invitasjon";
        try {
          const errorData = await error.context?.json?.();
          errorMessage = errorData?.error || error.message || errorMessage;
        } catch {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }
      if (data?.error) throw new Error(data.error);

      toast.success(data?.reactivated ? "Bruker reaktivert: " + inviteEmail : "Invitasjon sendt til " + inviteEmail);
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("user");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (error: any) {
      toast.error(t("auto.kunne_ikke_sende_invitasjon") + error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateUserDirect = async () => {
    if (!createForm.email || !createForm.password || !company?.id) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user-direct', {
        body: {
          email: createForm.email,
          password: createForm.password,
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          companyId: company.id,
          role: createForm.role
        }
      });

      if (error) {
        // Try to get error message from response context
        let errorMessage = "Kunne ikke opprette bruker";
        try {
          const errorData = await error.context?.json?.();
          errorMessage = errorData?.error || error.message || errorMessage;
        } catch {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }
      if (data?.error) throw new Error(data.error);

      toast.success(t("auto.bruker_opprettet") + createForm.email);
      setCreateDirectDialogOpen(false);
      setCreateForm({ email: "", password: "", firstName: "", lastName: "", role: "user" });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (error: any) {
      toast.error(t("auto.kunne_ikke_opprette_bruker") + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("auto.ansatte")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("auto.administrer_ansattinformasjon_dokumenter")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canManage && (
              <>
                <Button 
                  onClick={() => setCreateDirectDialogOpen(true)}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {t("auto.legg_til")}
                </Button>
                <Button 
                  onClick={() => setInviteDialogOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {t("auto.send_invitasjon")}
                </Button>
                <Button
                  onClick={() => setBulkMessageOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send melding
                </Button>
                <Button
                  onClick={() => navigate("/time-registration")}
                  variant="outline"
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Timeføring
                </Button>
              </>
            )}
            <Button 
              onClick={() => navigate("/my-courses")}
              className="gap-2"
              variant="outline"
            >
              <IdCard className="h-4 w-4" />
              Mitt kursbevis
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t("auto.totalt_ansatte")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{courses?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t("auto.registrerte_kurs")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{expiringCourses.length}</p>
                  <p className="text-sm text-muted-foreground">{t("auto.kurs_utloeper")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{expiredCourses.length}</p>
                  <p className="text-sm text-muted-foreground">{t("auto.utgaatte_kurs")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hmsCardIssues.length > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                  <CreditCard className={`w-5 h-5 ${hmsCardIssues.length > 0 ? "text-red-500" : "text-green-500"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hmsCardIssues.length}</p>
                  <p className="text-sm text-muted-foreground">{t("auto.hms_kort_problemer")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees">{t("auto.ansatte")}</TabsTrigger>
            <TabsTrigger value="courses">{t("auto.kursoversikt")}</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("auto.soek_etter_ansatt")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Employee List */}
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.ansattoversikt")}</CardTitle>
                <CardDescription>
                  {t("auto.klikk_paa_en_ansatt_for_aa_se_detaljer_d")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("auto.laster_ansatte")}
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Ingen ansatte funnet" : "Ingen ansatte registrert ennå"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredEmployees.map((employee) => {
                      const employeeCourses = courses?.filter(c => c.employee_id === employee.id) || [];
                      const expiringCount = employeeCourses.filter(c => {
                        if (!c.expiry_date) return false;
                        const days = differenceInDays(new Date(c.expiry_date), new Date());
                        return days <= 30 && days >= 0;
                      }).length;
                      const expiredCount = employeeCourses.filter(c => 
                        c.expiry_date && isPast(new Date(c.expiry_date))
                      ).length;

                      // HMS card status
                      const hmsCardMissing = employee.hms_card_required && !employee.hms_card_obtained;
                      const hmsCardExpired = employee.hms_card_required && employee.hms_card_obtained && 
                        employee.hms_card_expiry_date && isPast(new Date(employee.hms_card_expiry_date));
                      const hmsCardExpiring = employee.hms_card_required && employee.hms_card_obtained && 
                        employee.hms_card_expiry_date && 
                        differenceInDays(new Date(employee.hms_card_expiry_date), new Date()) <= 30 &&
                        differenceInDays(new Date(employee.hms_card_expiry_date), new Date()) >= 0;

                      return (
                        <button
                          key={employee.id}
                          onClick={() => setSelectedEmployeeId(employee.id)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={employee.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(employee.first_name, employee.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {employee.email}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {(hmsCardMissing || hmsCardExpired) && (
                              <Badge variant="destructive" className="text-xs">
                                HMS-kort {hmsCardExpired ? "utgått" : "mangler"}
                              </Badge>
                            )}
                            {hmsCardExpiring && (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                {t("auto.hms_kort_utloeper")}
                              </Badge>
                            )}
                            {expiredCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {expiredCount} kurs utgått
                              </Badge>
                            )}
                            {expiringCount > 0 && (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                {expiringCount} kurs utløper
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {employeeCourses.length} kurs
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("auto.alle_kurs")}</CardTitle>
                <CardDescription>
                  {t("auto.oversikt_over_alle_registrerte_kurs_og_s")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("auto.ingen_kurs_registrert_ennaa")}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("auto.ansatt")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("auto.kurs")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("auto.fullfoert")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("auto.utloeper")}</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("auto.status_2")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses?.map((course) => {
                            const employee = employees?.find(e => e.id === course.employee_id);
                            const isExpired = course.expiry_date && isPast(new Date(course.expiry_date));
                            const isExpiringSoon = course.expiry_date && !isExpired && 
                              differenceInDays(new Date(course.expiry_date), new Date()) <= 30;
                            
                            return (
                              <tr key={course.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(employee?.first_name, employee?.last_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{employee?.first_name} {employee?.last_name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-medium">{course.course_name}</p>
                                    {course.course_provider && (
                                      <p className="text-sm text-muted-foreground">{course.course_provider}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">
                                  {format(new Date(course.completed_date), "d. MMM yyyy", { locale: nb })}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">
                                  {course.expiry_date 
                                    ? format(new Date(course.expiry_date), "d. MMM yyyy", { locale: nb })
                                    : "Ingen utløp"
                                  }
                                </td>
                                <td className="py-3 px-4">
                                  {isExpired ? (
                                    <Badge variant="destructive">{t("auto.utgaatt")}</Badge>
                                  ) : isExpiringSoon ? (
                                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                      {t("auto.utloeper_snart")}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                      {t("auto.gyldig")}
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {courses?.map((course) => {
                        const employee = employees?.find(e => e.id === course.employee_id);
                        const isExpired = course.expiry_date && isPast(new Date(course.expiry_date));
                        const isExpiringSoon = course.expiry_date && !isExpired && 
                          differenceInDays(new Date(course.expiry_date), new Date()) <= 30;
                        
                        return (
                          <div key={course.id} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(employee?.first_name, employee?.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{employee?.first_name} {employee?.last_name}</span>
                              </div>
                              {isExpired ? (
                                <Badge variant="destructive">{t("auto.utgaatt")}</Badge>
                              ) : isExpiringSoon ? (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                  {t("auto.utloeper_snart")}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                  {t("auto.gyldig")}
                                </Badge>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{course.course_name}</p>
                              {course.course_provider && (
                                <p className="text-sm text-muted-foreground">{course.course_provider}</p>
                              )}
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Fullført: {format(new Date(course.completed_date), "d. MMM yyyy", { locale: nb })}</span>
                              <span>
                                {course.expiry_date 
                                  ? `Utløper: ${format(new Date(course.expiry_date), "d. MMM yyyy", { locale: nb })}`
                                  : "Ingen utløp"
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Employee Detail Dialog */}
      {selectedEmployee && (
        <EmployeeDetailDialog
          employee={selectedEmployee}
          open={!!selectedEmployeeId}
          onOpenChange={(open) => !open && setSelectedEmployeeId(null)}
          canManage={canManage}
        />
      )}

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auto.send_invitasjon")}</DialogTitle>
            <DialogDescription>
              {t("auto.send_en_e_postinvitasjon_til_en_ny_ansat")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t("auto.e_postadresse")}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="ansatt@firma.no"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">{t("auto.rolle")}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("auto.bruker")}</SelectItem>
                  <SelectItem value="company_admin">{t("auto.bedriftsadministrator")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button onClick={handleInviteUser} disabled={!inviteEmail || isInviting}>
              {isInviting ? "Sender..." : "Send invitasjon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Direct Dialog */}
      <Dialog open={createDirectDialogOpen} onOpenChange={setCreateDirectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auto.legg_til_ansatt")}</DialogTitle>
            <DialogDescription>
              {t("auto.opprett_en_ny_ansatt_med_brukernavn_og_p")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">{t("auto.e_postadresse")}</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="ansatt@firma.no"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">{t("auto.passord")}</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auto.velg_et_passord")}
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-firstname">{t("auto.fornavn")}</Label>
                <Input
                  id="create-firstname"
                  placeholder={t("auto.fornavn")}
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastname">{t("auto.etternavn")}</Label>
                <Input
                  id="create-lastname"
                  placeholder={t("auto.etternavn")}
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">{t("auto.rolle")}</Label>
              <Select 
                value={createForm.role} 
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("auto.bruker")}</SelectItem>
                  <SelectItem value="company_admin">{t("auto.bedriftsadministrator")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDirectDialogOpen(false)}>
              {t("auto.avbryt")}
            </Button>
            <Button 
              onClick={handleCreateUserDirect} 
              disabled={!createForm.email || !createForm.password || isCreating}
            >
              {isCreating ? "Oppretter..." : "Opprett bruker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BulkMessageDialog open={bulkMessageOpen} onOpenChange={setBulkMessageOpen} />
    </AppLayout>
  );
}