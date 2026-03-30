import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkSchedules } from "@/hooks/useWorkSchedules";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Clock, User, Settings, MapPin, Shield, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, startOfMonth, addMonths, endOfMonth } from "date-fns";
import { nb } from "date-fns/locale";
import { ShiftCalendar } from "@/components/work-schedule/ShiftCalendar";
import { ShiftDetailsDialog } from "@/components/work-schedule/ShiftDetailsDialog";
import { CreateShiftDialog } from "@/components/work-schedule/CreateShiftDialog";
import { StandardScheduleDialog } from "@/components/work-schedule/StandardScheduleDialog";
import type { WorkSchedule as WorkScheduleType } from "@/hooks/useWorkSchedules";

export default function WorkSchedule() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const { schedules, isLoading, createSchedule, deleteSchedule, refetch } = useWorkSchedules();
  const { users } = useCompanyUsers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStandardScheduleOpen, setIsStandardScheduleOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkScheduleType | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isAdmin = isCompanyAdmin || isSystemAdmin;

  const getWeekSchedules = () => {
    const weekEnd = addDays(selectedWeek, 6);
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.schedule_date);
      return scheduleDate >= selectedWeek && scheduleDate <= weekEnd;
    });
  };

  const weekSchedules = getWeekSchedules();
  const plannedSchedules = weekSchedules.filter(s => s.schedule_type === "planned");
  const actualSchedules = weekSchedules.filter(s => s.schedule_type === "actual");

  const calculateHours = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const hours = endHour - startHour + (endMin - startMin) / 60;
    return hours.toFixed(1);
  };

  const handleScheduleClick = (schedule: WorkScheduleType) => {
    setSelectedSchedule(schedule);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Laster arbeidsplaner...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Arbeidsplanlegger</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Vaktliste med oppgaver og ansvar
            </p>
          </div>
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsStandardScheduleOpen(true)} className="w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Standard arbeidstid
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Ny vakt
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            className="w-full sm:w-auto"
          >
            Forrige uke
          </Button>
          <div className="flex-1 text-center font-medium text-sm sm:text-base py-2 sm:py-0">
            <div className="sm:hidden">Uke {format(selectedWeek, "w, yyyy", { locale: nb })}</div>
            <div className="hidden sm:block">
              Uke {format(selectedWeek, "w, yyyy", { locale: nb })} ({format(selectedWeek, "d. MMM", { locale: nb })} - {format(addDays(selectedWeek, 6), "d. MMM", { locale: nb })})
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            className="w-full sm:w-auto"
          >
            Neste uke
          </Button>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
            <TabsTrigger value="planned">Planlagt ({plannedSchedules.length})</TabsTrigger>
            <TabsTrigger value="actual">Faktisk ({actualSchedules.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <ShiftCalendar 
              schedules={weekSchedules} 
              selectedWeek={selectedWeek}
              onScheduleClick={handleScheduleClick}
            />
          </TabsContent>

          <TabsContent value="planned">
            <Card>
              <CardHeader>
                <CardTitle>Planlagte vakter</CardTitle>
                <CardDescription>Oversikt over planlagte vakter for uken</CardDescription>
              </CardHeader>
              <CardContent>
                {plannedSchedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Ingen planlagte vakter denne uken
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plannedSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-3 sm:p-4 border rounded-lg space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleScheduleClick(schedule)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm sm:text-base">{schedule.employee_name}</span>
                            {schedule.is_responsible && (
                              <Badge variant="default" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Ansvar
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="sm:hidden">{format(new Date(schedule.schedule_date), "EEE d. MMM", { locale: nb })}</span>
                            <span className="hidden sm:inline">{format(new Date(schedule.schedule_date), "EEEE d. MMM", { locale: nb })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                          </div>
                          {schedule.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {schedule.location}
                            </div>
                          )}
                          {schedule.shift_role && (
                            <Badge variant="secondary" className="text-xs">
                              {schedule.shift_role}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs w-fit">
                            {calculateHours(schedule.start_time, schedule.end_time)} timer
                          </Badge>
                        </div>
                        {schedule.notes && (
                          <p className="text-xs sm:text-sm text-muted-foreground">{schedule.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actual">
            <Card>
              <CardHeader>
                <CardTitle>Registrerte arbeidstimer</CardTitle>
                <CardDescription>Faktisk arbeidstid for uken</CardDescription>
              </CardHeader>
              <CardContent>
                {actualSchedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Ingen registrerte arbeidstimer denne uken
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actualSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-3 sm:p-4 border rounded-lg bg-muted/30 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleScheduleClick(schedule)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm sm:text-base">{schedule.employee_name}</span>
                            {schedule.is_responsible && (
                              <Badge variant="default" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Ansvar
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="sm:hidden">{format(new Date(schedule.schedule_date), "EEE d. MMM", { locale: nb })}</span>
                            <span className="hidden sm:inline">{format(new Date(schedule.schedule_date), "EEEE d. MMM", { locale: nb })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                          </div>
                          {schedule.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {schedule.location}
                            </div>
                          )}
                          {schedule.shift_role && (
                            <Badge variant="secondary" className="text-xs">
                              {schedule.shift_role}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs w-fit">
                            {calculateHours(schedule.start_time, schedule.end_time)} timer
                          </Badge>
                        </div>
                        {schedule.notes && (
                          <p className="text-xs sm:text-sm text-muted-foreground">{schedule.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateShiftDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetch}
      />

      <StandardScheduleDialog 
        open={isStandardScheduleOpen} 
        onOpenChange={setIsStandardScheduleOpen}
        selectedWeek={selectedWeek}
        onSchedulesGenerated={refetch}
      />

      <ShiftDetailsDialog 
        schedule={selectedSchedule} 
        onClose={() => setSelectedSchedule(null)}
        onUpdate={refetch}
        onDelete={async (id) => {
          await deleteSchedule(id);
          refetch();
        }}
        isAdmin={isAdmin}
      />
    </AppLayout>
  );
}
