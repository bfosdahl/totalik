import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CalendarDays, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Thermometer, 
  Package, 
  SprayCan,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIkMatScheduledTasks, CalendarEvent } from "@/hooks/useIkMatScheduledTasks";
import { CreateScheduledTaskDialog } from "./CreateScheduledTaskDialog";
import { TaskListView } from "./TaskListView";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, isToday, isBefore, startOfDay, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

export const KalenderTab = () => {
  const { company } = useAuth();
  const navigate = useNavigate();
  const { tasks, tasksLoading, useCalendarEvents, generateTaskInstances, completeTask } = useIkMatScheduledTasks();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<'calendar' | 'list'>('calendar');
  const [showTodayTasksDialog, setShowTodayTasksDialog] = useState(false);
  const [showOverdueTasksDialog, setShowOverdueTasksDialog] = useState(false);

  // Calculate date range for fetching events
  const dateRange = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { locale: nb });
    const end = endOfWeek(endOfMonth(currentMonth), { locale: nb });
    return { start, end };
  }, [currentMonth]);

  const { data: calendarEvents, isLoading: eventsLoading } = useCalendarEvents(dateRange.start, dateRange.end);

  // Generate scheduled task instances and merge with actual events
  const allEvents = useMemo(() => {
    if (!tasks) return calendarEvents || [];

    const scheduledInstances = generateTaskInstances(dateRange.start, dateRange.end, tasks);
    
    // Merge: actual completions override scheduled instances
    const completedTaskDates = new Set(
      (calendarEvents || [])
        .filter(e => e.type === 'task' && e.status === 'completed')
        .map(e => `${e.taskId}-${format(e.date, 'yyyy-MM-dd')}`)
    );

    const filteredInstances = scheduledInstances.filter(
      inst => !completedTaskDates.has(`${inst.taskId}-${format(inst.date, 'yyyy-MM-dd')}`)
    );

    return [...(calendarEvents || []), ...filteredInstances];
  }, [tasks, calendarEvents, dateRange, generateTaskInstances]);

  // Get events for the selected date
  const selectedDateEvents = useMemo(() => {
    return allEvents.filter(event => isSameDay(event.date, selectedDate));
  }, [allEvents, selectedDate]);

  // Get today's pending tasks
  const todaysPendingTasks = useMemo(() => {
    return allEvents.filter(
      event => isToday(event.date) && event.status !== 'completed'
    );
  }, [allEvents]);

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    return allEvents.filter(
      event => event.status === 'overdue' || 
        (event.status === 'pending' && isBefore(startOfDay(event.date), startOfDay(new Date())))
    );
  }, [allEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'varemottak': return <Package className="h-4 w-4" />;
      case 'cleaning': return <SprayCan className="h-4 w-4" />;
      default: return <ListTodo className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Fullført</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Avvik</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Venter</Badge>;
    }
  };

  // Custom day content renderer for calendar
  const getDayContent = (day: Date) => {
    const dayEvents = allEvents.filter(event => isSameDay(event.date, day));
    const hasCompleted = dayEvents.some(e => e.status === 'completed');
    const hasOverdue = dayEvents.some(e => e.status === 'overdue' || 
      (e.status === 'pending' && isBefore(startOfDay(e.date), startOfDay(new Date()))));
    const hasPending = dayEvents.some(e => e.status === 'pending' && !isBefore(startOfDay(e.date), startOfDay(new Date())));

    if (dayEvents.length === 0) return null;

    return (
      <div className="flex gap-0.5 justify-center mt-1">
        {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
        {hasOverdue && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
        {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
      </div>
    );
  };

  const handleCompleteTask = async (event: CalendarEvent) => {
    if (event.taskId) {
      await completeTask.mutateAsync({
        taskId: event.taskId,
        scheduledDate: event.date,
      });
    }
  };

  if (tasksLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">
            Oversikt over alle gjøremål, renhold, temperaturer og varemottak
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny oppgave
        </Button>
      </div>

      {/* Quick stats - horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
        <div className="flex gap-3 sm:grid sm:grid-cols-3 sm:gap-4 min-w-max sm:min-w-0">
          <Card 
            className={`min-w-[160px] sm:min-w-0 cursor-pointer hover:shadow-md transition-shadow ${todaysPendingTasks.length > 0 ? "border-orange-500" : "border-green-500"}`}
            onClick={() => setShowTodayTasksDialog(true)}
          >
            <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                I dag
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 sm:px-6">
              <p className="text-xl sm:text-2xl font-bold">
                {todaysPendingTasks.length} 
                <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1 sm:ml-2">
                  gjenstår
                </span>
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`min-w-[160px] sm:min-w-0 cursor-pointer hover:shadow-md transition-shadow ${overdueTasks.length > 0 ? "border-red-500" : ""}`}
            onClick={() => setShowOverdueTasksDialog(true)}
          >
            <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Avvik
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 sm:px-6">
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                {overdueTasks.length}
                <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1 sm:ml-2">
                  oppgaver
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="min-w-[160px] sm:min-w-0">
            <CardHeader className="py-2 sm:py-3 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Planlagt
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 sm:px-6">
              <p className="text-xl sm:text-2xl font-bold">
                {tasks?.length || 0}
                <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1 sm:ml-2">
                  maler
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View switcher */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Kalender
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Oppgaveliste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          {/* Mobile: Events first, then calendar. Desktop: side by side */}
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Selected date events - Shows first on mobile */}
            <Card className="lg:order-2">
              <CardHeader className="py-3 sm:py-6">
                <CardTitle className="text-base sm:text-lg">
                  {format(selectedDate, 'EEEE d. MMMM', { locale: nb })}
                </CardTitle>
                <CardDescription>
                  {selectedDateEvents.length} hendelser
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ScrollArea className="h-[250px] sm:h-[400px]">
                  {selectedDateEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Ingen hendelser denne dagen
                    </p>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div 
                          key={event.id}
                          className="p-2.5 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {getEventIcon(event.type)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {event.status === 'completed' ? format(event.date, 'HH:mm', { locale: nb }) : 'Ikke utført'}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(event.status)}
                          </div>
                          {/* Action button for pending temperature/cleaning tasks */}
                          {event.status !== 'completed' && event.actionUrl && (
                            <Button
                              size="sm"
                              variant="default"
                              className="mt-2 w-full"
                              onClick={() => navigate(event.actionUrl!)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Utfør oppgave
                            </Button>
                          )}
                          {/* Complete button for scheduled tasks */}
                          {event.type === 'task' && event.status !== 'completed' && event.taskId && !event.actionUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full"
                              onClick={() => handleCompleteTask(event)}
                              disabled={completeTask.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Fullført
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="lg:col-span-2 lg:order-1">
              <CardHeader className="pb-2 px-3 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">
                    {format(currentMonth, 'MMMM yyyy', { locale: nb })}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                      onClick={() => {
                        setCurrentMonth(new Date());
                        setSelectedDate(new Date());
                      }}
                    >
                      I dag
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={nb}
                  showOutsideDays={false}
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-2",
                    caption: "hidden",
                    nav: "hidden",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.7rem] sm:text-[0.8rem]",
                    row: "flex w-full mt-1",
                    cell: "h-9 sm:h-11 w-full text-center text-sm p-0 relative",
                    day: "h-9 sm:h-11 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                  }}
                  className="rounded-md border p-2 sm:p-3"
                  components={{
                    DayContent: ({ date }) => (
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-xs sm:text-sm">{date.getDate()}</span>
                        {getDayContent(date)}
                      </div>
                    ),
                  }}
                />
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                    <span>Fullført</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                    <span>Avvik</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500" />
                    <span>Venter</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TaskListView 
            tasks={tasks || []} 
            onCreateTask={() => setCreateDialogOpen(true)}
          />
        </TabsContent>
      </Tabs>

      <CreateScheduledTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Today's pending tasks dialog */}
      <Dialog open={showTodayTasksDialog} onOpenChange={setShowTodayTasksDialog}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Dagens gjenstående oppgaver
            </DialogTitle>
            <DialogDescription>
              {todaysPendingTasks.length === 0 
                ? "Alle oppgaver for i dag er fullført!" 
                : `${todaysPendingTasks.length} oppgave${todaysPendingTasks.length > 1 ? 'r' : ''} gjenstår`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-4">
            {todaysPendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-muted-foreground">Ingen oppgaver gjenstår for i dag</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysPendingTasks.map((event) => (
                  <div 
                    key={event.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      {getEventIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {event.type === 'temperature' ? 'Temperaturlogging' : 
                           event.type === 'cleaning' ? 'Renhold' : 
                           event.type === 'varemottak' ? 'Varemottak' : 'Oppgave'}
                        </p>
                      </div>
                    </div>
                    {event.actionUrl ? (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTodayTasksDialog(false);
                          // Use setTimeout to ensure dialog closes before navigation
                          setTimeout(() => {
                            navigate(event.actionUrl!);
                          }, 100);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Utfør oppgave
                      </Button>
                    ) : event.type === 'task' && event.taskId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => {
                          handleCompleteTask(event);
                          setShowTodayTasksDialog(false);
                        }}
                        disabled={completeTask.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Marker som fullført
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Overdue tasks dialog */}
      <Dialog open={showOverdueTasksDialog} onOpenChange={setShowOverdueTasksDialog}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Avvik - Oppgaver ikke utført
            </DialogTitle>
            <DialogDescription>
              {overdueTasks.length === 0 
                ? "Ingen avvik registrert" 
                : `${overdueTasks.length} oppgave${overdueTasks.length > 1 ? 'r' : ''} ikke utført i tide`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-4">
            {overdueTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <p className="text-muted-foreground">Ingen avvik</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((event) => (
                  <div 
                    key={event.id}
                    className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                  >
                    <div className="flex items-start gap-3">
                      {getEventIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Forfalt: {format(event.date, 'd. MMMM yyyy', { locale: nb })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
