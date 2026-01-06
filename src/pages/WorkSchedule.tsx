import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkSchedules } from "@/hooks/useWorkSchedules";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Clock, User } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { nb } from "date-fns/locale";

export default function WorkSchedule() {
  const { profile, isCompanyAdmin, isSystemAdmin } = useAuth();
  const { schedules, isLoading, createSchedule } = useWorkSchedules();
  const { users } = useCompanyUsers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [formData, setFormData] = useState<{
    employee_id: string | undefined;
    employee_name: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
    schedule_type: "planned" | "actual";
    notes: string;
  }>({
    employee_id: undefined,
    employee_name: "",
    schedule_date: "",
    start_time: "",
    end_time: "",
    schedule_type: "planned",
    notes: "",
  });

  const isAdmin = isCompanyAdmin || isSystemAdmin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createSchedule(formData);
    if (success) {
      setIsDialogOpen(false);
      setFormData({
        employee_id: undefined,
        employee_name: "",
        schedule_date: "",
        start_time: "",
        end_time: "",
        schedule_type: "planned",
        notes: "",
      });
    }
  };

  const handleEmployeeChange = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setFormData({
        ...formData,
        employee_id: userId,
        employee_name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Ukjent",
      });
    }
  };

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
            Planlegg arbeidstider og registrer faktiske timer
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Ny arbeidsplan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Ny arbeidsplan</DialogTitle>
                  <DialogDescription>
                    Legg til planlagt eller faktisk arbeidstid
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Ansatt</Label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={handleEmployeeChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg ansatt" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule_type">Type</Label>
                    <Select
                      value={formData.schedule_type}
                      onValueChange={(value: any) => setFormData({ ...formData, schedule_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planlagt</SelectItem>
                        <SelectItem value="actual">Faktisk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule_date">Dato</Label>
                    <Input
                      id="schedule_date"
                      type="date"
                      required
                      value={formData.schedule_date}
                      onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Fra</Label>
                      <Input
                        id="start_time"
                        type="time"
                        required
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Til</Label>
                      <Input
                        id="end_time"
                        type="time"
                        required
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notater (valgfri)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Skriv eventuelle notater..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit">Lagre</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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

      <Tabs defaultValue="planned">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planned">Planlagt ({plannedSchedules.length})</TabsTrigger>
          <TabsTrigger value="actual">Faktisk ({actualSchedules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="planned">
          <Card>
            <CardHeader>
              <CardTitle>Planlagte arbeidstider</CardTitle>
              <CardDescription>Oversikt over planlagte arbeidstimer for uken</CardDescription>
            </CardHeader>
            <CardContent>
              {plannedSchedules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Ingen planlagte arbeidstimer denne uken
                </div>
              ) : (
                <div className="space-y-4">
                  {plannedSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-3 sm:p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm sm:text-base">{schedule.employee_name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="sm:hidden">{format(new Date(schedule.schedule_date), "EEE d. MMM", { locale: nb })}</span>
                          <span className="hidden sm:inline">{format(new Date(schedule.schedule_date), "EEEE d. MMM", { locale: nb })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                        </div>
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
                      className="p-3 sm:p-4 border rounded-lg bg-muted/30 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm sm:text-base">{schedule.employee_name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="sm:hidden">{format(new Date(schedule.schedule_date), "EEE d. MMM", { locale: nb })}</span>
                          <span className="hidden sm:inline">{format(new Date(schedule.schedule_date), "EEEE d. MMM", { locale: nb })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                        </div>
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
    </AppLayout>
  );
}
