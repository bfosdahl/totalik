import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Thermometer, Plus, CheckCircle2, AlertTriangle, History, Settings, Clock } from "lucide-react";
import { useIkMatTemperature } from "@/hooks/useIkMatTemperature";
import { LogTemperatureDialog } from "@/components/ikmat/LogTemperatureDialog";
import { ManageEquipmentDialog } from "@/components/ikmat/ManageEquipmentDialog";
import { TemperatureHistoryDialog } from "@/components/ikmat/TemperatureHistoryDialog";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const TemperaturloggTab = () => {
  const { company } = useAuth();
  const { 
    equipment, 
    todaysLogs, 
    isLoading, 
    getEquipmentNeedingLog,
    isDailyLogComplete,
    EQUIPMENT_TYPE_DEFAULTS 
  } = useIkMatTemperature();

  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  const equipmentNeedingLog = getEquipmentNeedingLog();
  const allComplete = isDailyLogComplete();

  const getEquipmentTypeLabel = (type: string) => {
    return EQUIPMENT_TYPE_DEFAULTS[type as keyof typeof EQUIPMENT_TYPE_DEFAULTS]?.label || type;
  };

  const handleLogClick = (equipmentId?: string) => {
    setSelectedEquipment(equipmentId || null);
    setLogDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm sm:text-base">
          Daglig temperaturkontroll for Mattilsynet
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)}>
            <History className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Historikk</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEquipmentDialogOpen(true)}>
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Utstyr</span>
          </Button>
          <Button size="sm" onClick={() => handleLogClick()} className="ml-auto sm:ml-0">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            Registrer
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {equipment.length > 0 && (
        allComplete ? (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Alle daglige temperaturmålinger er fullført for i dag!
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700 dark:text-orange-400">
              {equipmentNeedingLog.length} av {equipment.length} målinger gjenstår i dag
            </AlertDescription>
          </Alert>
        )
      )}

      {equipment.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Thermometer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen utstyr registrert</h3>
            <p className="text-muted-foreground mb-4">
              Legg til kjøleskap, frysere og annet utstyr som skal temperaturlogges
            </p>
            <Button onClick={() => setEquipmentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til utstyr
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Dagens målinger</TabsTrigger>
            <TabsTrigger value="equipment">Utstyrsoversikt</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {/* Quick log cards for equipment needing log */}
            {equipmentNeedingLog.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {equipmentNeedingLog.map((equip) => (
                  <Card 
                    key={equip.id} 
                    className="cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
                    onClick={() => handleLogClick(equip.id)}
                  >
                    <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="truncate">{equip.name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm truncate">
                        {getEquipmentTypeLabel(equip.equipment_type)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {equip.min_temp}°C - {equip.max_temp}°C
                        </span>
                        <Badge variant="outline" className="text-orange-600 border-orange-500 text-xs w-fit">
                          <Clock className="h-3 w-3 mr-1" />
                          Venter
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Today's logs - Cards on mobile, Table on desktop */}
            {todaysLogs.length > 0 && (
              <Card>
                <CardHeader className="py-3 sm:py-6">
                  <CardTitle className="text-base sm:text-lg">Registrerte målinger i dag</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {format(new Date(), 'EEEE d. MMMM yyyy', { locale: nb })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {/* Mobile view - cards */}
                  <div className="sm:hidden space-y-2">
                    {todaysLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{log.equipment?.name || 'Ukjent'}</span>
                          <span className={`font-mono text-lg ${
                            log.is_acceptable ? 'text-green-600' : 'text-red-600 font-bold'
                          }`}>
                            {log.temperature}°C
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{log.measured_by_name}</span>
                          <span>{format(new Date(log.measured_at), 'HH:mm', { locale: nb })}</span>
                        </div>
                        {log.is_acceptable ? (
                          <Badge variant="success" className="mt-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />Avvik
                          </Badge>
                        )}
                        {log.corrective_action && (
                          <p className="mt-2 text-xs text-orange-600">Tiltak: {log.corrective_action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop view - table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utstyr</TableHead>
                          <TableHead>Temperatur</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registrert av</TableHead>
                          <TableHead>Tidspunkt</TableHead>
                          <TableHead>Merknad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todaysLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.equipment?.name || 'Ukjent'}
                            </TableCell>
                            <TableCell>
                              <span className={`font-mono text-lg ${
                                log.is_acceptable ? 'text-green-600' : 'text-red-600 font-bold'
                              }`}>
                                {log.temperature}°C
                              </span>
                            </TableCell>
                            <TableCell>
                              {log.is_acceptable ? (
                                <Badge variant="success">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  OK
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Avvik
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{log.measured_by_name}</TableCell>
                            <TableCell>
                              {format(new Date(log.measured_at), 'HH:mm', { locale: nb })}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {log.corrective_action && (
                                <span className="text-orange-600">
                                  Tiltak: {log.corrective_action}
                                </span>
                              )}
                              {log.notes && !log.corrective_action && log.notes}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {todaysLogs.length === 0 && equipmentNeedingLog.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Ingen målinger å vise
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registrert utstyr</CardTitle>
                <CardDescription>
                  Kjøleskap, frysere og annet utstyr som skal temperaturlogges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navn</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Plassering</TableHead>
                      <TableHead>Temperaturgrenser</TableHead>
                      <TableHead>Frekvens</TableHead>
                      <TableHead>Status i dag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((equip) => {
                      const hasLogToday = todaysLogs.some(log => log.equipment_id === equip.id);
                      const todayLog = todaysLogs.find(log => log.equipment_id === equip.id);
                      
                      return (
                        <TableRow key={equip.id}>
                          <TableCell className="font-medium">{equip.name}</TableCell>
                          <TableCell>{getEquipmentTypeLabel(equip.equipment_type)}</TableCell>
                          <TableCell>{equip.location || '-'}</TableCell>
                          <TableCell>
                            {equip.min_temp}°C til {equip.max_temp}°C
                          </TableCell>
                          <TableCell>
                            {equip.measurement_frequency === 'daily' ? 'Daglig' :
                             equip.measurement_frequency === 'twice_daily' ? '2x daglig' : 'Ukentlig'}
                          </TableCell>
                          <TableCell>
                            {hasLogToday ? (
                              <Badge variant={todayLog?.is_acceptable ? "success" : "destructive"}>
                                {todayLog?.temperature}°C
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600">
                                Ikke registrert
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <LogTemperatureDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        preSelectedEquipmentId={selectedEquipment}
      />

      <ManageEquipmentDialog
        open={equipmentDialogOpen}
        onOpenChange={setEquipmentDialogOpen}
      />

      <TemperatureHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />
    </div>
  );
};
