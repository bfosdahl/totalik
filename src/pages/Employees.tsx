import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, GraduationCap, FileText, AlertCircle, ChevronRight, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeDetailDialog } from "@/components/employees/EmployeeDetailDialog";
import { format, differenceInDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";

export default function Employees() {
  const { isCompanyAdmin, isSystemAdmin } = useAuth();
  const { employees, courses, isLoading } = useEmployees();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ansatte</h1>
          <p className="text-muted-foreground mt-1">
            Administrer ansattinformasjon, dokumenter og kurs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Totalt ansatte</p>
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
                  <p className="text-sm text-muted-foreground">Registrerte kurs</p>
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
                  <p className="text-sm text-muted-foreground">Kurs utløper</p>
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
                  <p className="text-sm text-muted-foreground">Utgåtte kurs</p>
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
                  <p className="text-sm text-muted-foreground">HMS-kort problemer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees">Ansatte</TabsTrigger>
            <TabsTrigger value="courses">Kursoversikt</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter ansatt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Employee List */}
            <Card>
              <CardHeader>
                <CardTitle>Ansattoversikt</CardTitle>
                <CardDescription>
                  Klikk på en ansatt for å se detaljer, dokumenter og kurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Laster ansatte...
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
                                HMS-kort utløper
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
                <CardTitle>Alle kurs</CardTitle>
                <CardDescription>
                  Oversikt over alle registrerte kurs og sertifiseringer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Ingen kurs registrert ennå
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ansatt</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kurs</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fullført</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Utløper</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
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
                                  <Badge variant="destructive">Utgått</Badge>
                                ) : isExpiringSoon ? (
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                    Utløper snart
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                    Gyldig
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
    </AppLayout>
  );
}