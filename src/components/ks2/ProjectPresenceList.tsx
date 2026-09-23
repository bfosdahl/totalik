import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PositionMap } from "@/components/map/PositionMap";
import { format, parseISO, subDays } from "date-fns";
import { MapPin, Users } from "lucide-react";

interface ProjectPresenceListProps {
  projectId: string;
  geofence?: { enabled: boolean; lat: number | null; lng: number | null; radiusM: number };
}

interface PresenceRow {
  id: string;
  user_name: string;
  clock_in: string;
  clock_out: string | null;
  status: string;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  geofence_status_in: string | null;
  geofence_status_out: string | null;
  geofence_distance_in_m: number | null;
  geofence_distance_out_m: number | null;
  geofence_reason: string | null;
}

function StatusDot({ status, distance }: { status: string | null; distance: number | null }) {
  if (status === "inside") {
    return <Badge className="bg-green-600">Innenfor</Badge>;
  }
  if (status === "outside") {
    return <Badge variant="destructive">Utenfor{distance != null ? ` (${distance} m)` : ""}</Badge>;
  }
  return <Badge variant="secondary">Ingen posisjon</Badge>;
}

export function ProjectPresenceList({ projectId, geofence }: ProjectPresenceListProps) {
  const [mapRow, setMapRow] = useState<{ row: PresenceRow; which: "in" | "out" } | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["project-presence", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_clock_entries" as any)
        .select(
          "id, user_name, clock_in, clock_out, status, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng, geofence_status_in, geofence_status_out, geofence_distance_in_m, geofence_distance_out_m, geofence_reason"
        )
        .eq("project_id", projectId)
        .gte("clock_in", subDays(new Date(), 14).toISOString())
        .order("clock_in", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PresenceRow[];
    },
    refetchInterval: 60000,
  });

  const onSite = rows.filter((r) => r.status === "active");

  const mapPosition = mapRow
    ? mapRow.which === "in"
      ? mapRow.row.clock_in_lat != null && mapRow.row.clock_in_lng != null
        ? { lat: mapRow.row.clock_in_lat, lng: mapRow.row.clock_in_lng }
        : null
      : mapRow.row.clock_out_lat != null && mapRow.row.clock_out_lng != null
      ? { lat: mapRow.row.clock_out_lat, lng: mapRow.row.clock_out_lng }
      : null
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4" /> På plassen nå ({onSite.length})
          </CardTitle>
          <CardDescription>
            Elektronisk mannskapsliste – hvem som har startet og stoppet arbeidstid på prosjektet
            {geofence?.enabled ? ", og om det ble gjort innenfor prosjektområdet." : "."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Laster...</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Ingen har startet arbeidstid på prosjektet de siste 14 dagene.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Inn</TableHead>
                    <TableHead>Ut</TableHead>
                    <TableHead>Innstempling</TableHead>
                    <TableHead>Utstempling</TableHead>
                    <TableHead>Begrunnelse</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className={r.status === "active" ? "bg-green-500/5" : ""}>
                      <TableCell className="font-medium">
                        {r.user_name}
                        {r.status === "active" && <Badge className="ml-2 bg-green-600">På plassen</Badge>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(r.clock_in), "dd.MM HH:mm")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.clock_out ? format(parseISO(r.clock_out), "dd.MM HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusDot status={r.geofence_status_in} distance={r.geofence_distance_in_m} />
                      </TableCell>
                      <TableCell>
                        {r.clock_out ? (
                          <StatusDot status={r.geofence_status_out} distance={r.geofence_distance_out_m} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{r.geofence_reason || "—"}</TableCell>
                      <TableCell>
                        {(r.clock_in_lat != null || r.clock_out_lat != null) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Vis på kart"
                            onClick={() =>
                              setMapRow({ row: r, which: r.clock_in_lat != null ? "in" : "out" })
                            }
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!mapRow} onOpenChange={(o) => !o && setMapRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mapRow?.row.user_name} – {mapRow?.which === "in" ? "innstempling" : "utstempling"}
            </DialogTitle>
          </DialogHeader>
          {mapRow && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={mapRow.which === "in" ? "default" : "outline"}
                  disabled={mapRow.row.clock_in_lat == null}
                  onClick={() => setMapRow({ ...mapRow, which: "in" })}
                >
                  Innstempling
                </Button>
                <Button
                  size="sm"
                  variant={mapRow.which === "out" ? "default" : "outline"}
                  disabled={mapRow.row.clock_out_lat == null}
                  onClick={() => setMapRow({ ...mapRow, which: "out" })}
                >
                  Utstempling
                </Button>
              </div>
              <PositionMap
                position={mapPosition}
                fence={
                  geofence?.enabled && geofence.lat != null && geofence.lng != null
                    ? { lat: geofence.lat, lng: geofence.lng, radiusM: geofence.radiusM }
                    : null
                }
                height={280}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProjectPresenceList;
