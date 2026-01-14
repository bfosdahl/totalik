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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">
            Daglig temperaturkontroll for Mattilsynet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHistoryDialogOpen(true)}>
            <History className="h-4 w-4 mr-2" />
            Historikk
          </Button>
          <Button variant="outline" onClick={() => setEquipmentDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Administrer utstyr
          </Button>
          <Button onClick={() => handleLogClick()}>
            <Plus className="h-4 w-4 mr-2" />
            Registrer temperatur
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipmentNeedingLog.map((equip) => (
                  <Card 
                    key={equip.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleLogClick(equip.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        {equip.name}
                      </CardTitle>
                      <CardDescription>
                        {getEquipmentTypeLabel(equip.equipment_type)}
                        {equip.location && ` • ${equip.location}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Grense: {equip.min_temp}°C til {equip.max_temp}°C
                        </span>
                        <Badge variant="outline" className="text-orange-600 border-orange-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Venter
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Today's logs table */}
            {todaysLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Registrerte målinger i dag</CardTitle>
                  <CardDescription>
                    {format(new Date(), 'EEEE d. MMMM yyyy', { locale: nb })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
