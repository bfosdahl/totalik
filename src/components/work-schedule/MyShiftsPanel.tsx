import { useState } from "react";
import { format, isAfter, isBefore, startOfToday, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRightLeft, 
  Hand, 
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useWorkSchedules, WorkSchedule } from "@/hooks/useWorkSchedules";
import { useShiftRequests, ShiftRequest } from "@/hooks/useShiftRequests";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ShiftRequestDialog } from "./ShiftRequestDialog";
import { LOCATIONS, ROLES } from "./ShiftCalendar";

export function MyShiftsPanel() {
  const { profile } = useAuth();
  const { schedules } = useWorkSchedules();
  const { 
    requests, 
    getMyRequests, 
    getPendingForMe, 
    getOpenShifts,
    respondToRequest,
    takeOpenShift,
    cancelRequest
  } = useShiftRequests();
  
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<WorkSchedule | null>(null);
  const [requestType, setRequestType] = useState<"swap" | "availability" | "time_change" | "absence" | "new_shift">("swap");

  // Get my upcoming shifts
  const myShifts = schedules
    .filter(s => 
      s.employee_id === profile?.id && 
      s.schedule_type === "planned" &&
      isAfter(new Date(s.schedule_date), addDays(startOfToday(), -1))
    )
    .sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime());

  const pendingForMe = getPendingForMe();
  const myRequests = getMyRequests().filter(r => r.status === "pending" || r.status === "employee_approved");
  const openShifts = getOpenShifts();

  const handleSwapRequest = (shift: WorkSchedule) => {
    setSelectedShift(shift);
    setRequestType("swap");
    setRequestDialogOpen(true);
  };

  const handleAvailabilityRequest = (shift: WorkSchedule) => {
    setSelectedShift(shift);
    setRequestType("availability");
    setRequestDialogOpen(true);
  };

  const handleTimeChangeRequest = (shift: WorkSchedule) => {
    setSelectedShift(shift);
    setRequestType("time_change");
    setRequestDialogOpen(true);
  };

  const handleAbsenceRequest = (shift: WorkSchedule) => {
    setSelectedShift(shift);
    setRequestType("absence");
    setRequestDialogOpen(true);
  };

  const handleNewShiftRequest = () => {
    setSelectedShift(null);
    setRequestType("new_shift");
    setRequestDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Venter</Badge>;
      case "employee_approved":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Venter på leder</Badge>;
      case "manager_approved":
        return <Badge className="bg-green-500">Godkjent</Badge>;
      case "rejected":
        return <Badge variant="destructive">Avvist</Badge>;
      case "cancelled":
        return <Badge variant="outline">Kansellert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "swap": return "Vaktbytte";
      case "availability": return "Ledig vakt";
      case "time_change": return "Tidsendring";
      case "new_shift": return "Ny vakt";
      case "absence": return "Fravær";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="shifts">
        <TabsList className="h-auto flex w-full overflow-x-auto gap-1 p-1">
          <TabsTrigger value="shifts" className="flex-shrink-0 text-xs sm:text-sm px-3">
            Vakter ({myShifts.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-shrink-0 text-xs sm:text-sm px-3 relative">
            Til meg ({pendingForMe.length})
            {pendingForMe.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
                {pendingForMe.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-shrink-0 text-xs sm:text-sm px-3">
            Forespørsler ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="open" className="flex-shrink-0 text-xs sm:text-sm px-3">
            Ledige ({openShifts.length})
          </TabsTrigger>
        </TabsList>

        {/* My Shifts */}
        <TabsContent value="shifts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mine kommende vakter</CardTitle>
                <CardDescription>Dine planlagte vakter fremover</CardDescription>
              </div>
              <Button onClick={handleNewShiftRequest} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Be om vakt
              </Button>
            </CardHeader>
            <CardContent>
              {myShifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Ingen kommende vakter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myShifts.map((shift) => {
                    const location = shift.location ? LOCATIONS[shift.location] : null;
                    
                    return (
                      <div 
                        key={shift.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(shift.schedule_date), "EEEE d. MMMM", { locale: nb })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                              </span>
                              {location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {location.label}
                                </span>
                              )}
                              {shift.shift_role && (
                                <Badge variant="outline" className="text-xs">
                                  {ROLES[shift.shift_role] || shift.shift_role}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSwapRequest(shift)}
                              title="Be om å bytte vakt"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAvailabilityRequest(shift)}
                              title="Legg ut som ledig"
                            >
                              <Hand className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAbsenceRequest(shift)}
                              title="Meld fravær"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending requests for me */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Forespørsler til meg</CardTitle>
              <CardDescription>Bytteforespørsler du må svare på</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingForMe.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Ingen ventende forespørsler</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingForMe.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {request.requester_name} vil bytte vakt med deg
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.proposed_date && format(new Date(request.proposed_date), "d. MMMM yyyy", { locale: nb })}
                            {request.proposed_start_time && ` kl. ${request.proposed_start_time.substring(0, 5)}`}
                          </div>
                          {request.request_notes && (
                            <p className="text-sm mt-2">{request.request_notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => respondToRequest(request.id, "reject")}
                          >
                            Avslå
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => respondToRequest(request.id, "approve")}
                          >
                            Godta
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My requests */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Mine forespørsler</CardTitle>
              <CardDescription>Status på dine innsendte forespørsler</CardDescription>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Ingen aktive forespørsler</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getRequestTypeLabel(request.request_type)}</span>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.target_employee_name && `Til: ${request.target_employee_name}`}
                            {request.proposed_date && ` • ${format(new Date(request.proposed_date), "d. MMM", { locale: nb })}`}
                          </div>
                        </div>
                        {request.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => cancelRequest(request.id)}
                          >
                            Avbryt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open shifts */}
        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle>Ledige vakter</CardTitle>
              <CardDescription>Vakter som er tilgjengelige for å ta over</CardDescription>
            </CardHeader>
            <CardContent>
              {openShifts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Ingen ledige vakter akkurat nå</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openShifts.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg border-green-200 bg-green-50/50 dark:bg-green-950/20">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            Ledig vakt fra {request.requester_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.proposed_date && format(new Date(request.proposed_date), "EEEE d. MMMM", { locale: nb })}
                            {request.proposed_start_time && ` kl. ${request.proposed_start_time.substring(0, 5)}`}
                            {request.proposed_end_time && ` - ${request.proposed_end_time.substring(0, 5)}`}
                          </div>
                          {request.request_notes && (
                            <p className="text-sm mt-2">{request.request_notes}</p>
                          )}
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => takeOpenShift(request.id)}
                        >
                          Ta vakten
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ShiftRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        shift={selectedShift}
        requestType={requestType}
      />
    </div>
  );
}
