import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  FolderKanban,
  Merge,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { safeFormatDate } from "@/utils/safeFormatDate";
import { lookupBrregCompany, isValidOrgNumber } from "@/lib/brregLookup";

interface Customer {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  org_number: string | null;
  notes: string | null;
}

interface ProjectRow {
  id: string;
  project_number: string | null;
  project_name: string;
  status: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  client_name: string | null;
  customer_id: string | null;
}

const emptyForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  org_number: "",
  notes: "",
};

const fmtDate = (d: string | null) => safeFormatDate(d, "dd.MM.yyyy", "–");

export default function Ks2Kunder() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const [orgLookupLoading, setOrgLookupLoading] = useState(false);

  const handleOrgNumberChange = async (value: string) => {
    setForm((prev) => ({ ...prev, org_number: value }));
    if (!isValidOrgNumber(value)) return;
    setOrgLookupLoading(true);
    const info = await lookupBrregCompany(value);
    setOrgLookupLoading(false);
    if (info) {
      setForm((prev) => ({
        ...prev,
        name: prev.name.trim() ? prev.name : info.name,
        address: prev.address.trim() ? prev.address : info.address,
      }));
      toast.success(`Fant ${info.name} i Brønnøysundregistrene`);
    }
  };

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["company-customers", companyId],
    queryFn: async () => {
      if (!companyId) return [] as Customer[];
      const { data, error } = await supabase
        .from("company_customers")
        .select("id, name, contact_person, phone, email, address, org_number, notes")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as Customer[];
    },
    enabled: !!companyId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["customer-projects", companyId],
    queryFn: async () => {
      if (!companyId) return [] as ProjectRow[];
      const { data, error } = await supabase
        .from("ks_module2_projects")
        .select("id, project_number, project_name, status, planned_start_date, planned_end_date, client_name, customer_id")
        .eq("company_id", companyId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectRow[];
    },
    enabled: !!companyId,
  });

  const projectsByCustomer = useMemo(() => {
    const map = new Map<string, ProjectRow[]>();
    for (const c of customers) {
      const rows = projects.filter(
        (p) =>
          p.customer_id === c.id ||
          (!p.customer_id && (p.client_name || "").trim().toLowerCase() === c.name.trim().toLowerCase())
      );
      map.set(c.id, rows);
    }
    return map;
  }, [customers, projects]);

  const selectedProjects = selected ? projectsByCustomer.get(selected.id) || [] : [];
  const selectedProjectIds = selectedProjects.map((p) => p.id);

  const { data: stats } = useQuery({
    queryKey: ["customer-stats", selected?.id, selectedProjectIds.join(",")],
    queryFn: async () => {
      if (selectedProjectIds.length === 0) return { hours: 0, avvik: 0 };
      const [hoursRes, avvikRes] = await Promise.all([
        supabase.from("time_entries").select("hours").in("ks_project_id", selectedProjectIds),
        supabase
          .from("ks_module2_avvik")
          .select("id", { count: "exact", head: true })
          .in("project_id", selectedProjectIds),
      ]);
      const hours = (hoursRes.data || []).reduce((sum, r: any) => sum + Number(r.hours || 0), 0);
      return { hours, avvik: avvikRes.count ?? 0 };
    },
    enabled: !!selected,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contact_person || "").toLowerCase().includes(q) ||
        (c.org_number || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const saveCustomer = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Mangler bedrift");
      if (!form.name.trim()) throw new Error("Kundenavn er påkrevd");
      const payload = {
        company_id: companyId,
        name: form.name.trim(),
        contact_person: form.contact_person.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        org_number: form.org_number.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (selected) {
        const { error } = await supabase
          .from("company_customers")
          .update(payload)
          .eq("id", selected.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Kundekortet er lagret");
      queryClient.invalidateQueries({ queryKey: ["company-customers", companyId] });
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Kunne ikke lagre kundekortet"),
  });

  const mergeCustomer = useMutation({
    mutationFn: async () => {
      if (!selected || !mergeTarget) throw new Error("Velg kunde å slå sammen med");
      const { error: projErr } = await supabase
        .from("ks_module2_projects")
        .update({ customer_id: mergeTarget })
        .in("id", selectedProjectIds.length ? selectedProjectIds : ["00000000-0000-0000-0000-000000000000"]);
      if (projErr) throw projErr;
      const { error } = await supabase
        .from("company_customers")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: profile?.id ?? null,
        })
        .eq("id", selected.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kundene er slått sammen");
      queryClient.invalidateQueries({ queryKey: ["company-customers", companyId] });
      queryClient.invalidateQueries({ queryKey: ["customer-projects", companyId] });
      setMergeTarget("");
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Kunne ikke slå sammen kundene"),
  });

  const openNew = () => {
    setSelected(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openCustomer = (c: Customer) => {
    setSelected(c);
    setForm({
      name: c.name,
      contact_person: c.contact_person || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      org_number: c.org_number || "",
      notes: c.notes || "",
    });
    setMergeTarget("");
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" /> Kunder
            </h1>
            <p className="text-muted-foreground mt-1">
              Alle prosjekter samlet per kunde, med kontaktinfo og nøkkeltall.
            </p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Ny kunde
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Søk etter kunde, kontaktperson eller org.nr."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Ingen kunder registrert ennå. Kunder opprettes automatisk fra prosjektene, eller legg til
              manuelt.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const rows = projectsByCustomer.get(c.id) || [];
              const active = rows.filter((p) => p.status !== "completed" && p.status !== "avsluttet");
              return (
                <Card
                  key={c.id}
                  className="cursor-pointer transition hover:border-primary/50 hover:shadow-md"
                  onClick={() => openCustomer(c)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between gap-2">
                      <span className="line-clamp-1">{c.name}</span>
                      <Badge variant="secondary">{rows.length} prosj.</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {c.contact_person && <p className="line-clamp-1">{c.contact_person}</p>}
                    {c.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-2 line-clamp-1">
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </p>
                    )}
                    <p className="pt-1 text-xs">{active.length} pågående</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected ? selected.name : "Ny kunde"}</DialogTitle>
            <DialogDescription>
              {selected
                ? "Kontaktinfo og alle prosjekter på denne kunden."
                : "Registrer et nytt kundekort."}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <FolderKanban className="mx-auto h-4 w-4 text-primary" />
                  <p className="mt-1 text-lg font-semibold">{selectedProjects.length}</p>
                  <p className="text-xs text-muted-foreground">Prosjekter</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Clock className="mx-auto h-4 w-4 text-indigo-500" />
                  <p className="mt-1 text-lg font-semibold">{(stats?.hours ?? 0).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Timer</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <AlertTriangle className="mx-auto h-4 w-4 text-amber-500" />
                  <p className="mt-1 text-lg font-semibold">{stats?.avvik ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Avvik</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-name">Kundenavn</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-contact">Kontaktperson</Label>
              <Input
                id="c-contact"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-phone">Telefon</Label>
              <Input
                id="c-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">E-post</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-org">
                Organisasjonsnummer
                {orgLookupLoading && (
                  <span className="ml-2 text-xs text-muted-foreground">henter info...</span>
                )}
              </Label>
              <Input
                id="c-org"
                value={form.org_number}
                onChange={(e) => handleOrgNumberChange(e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-address">Adresse</Label>
              <Input
                id="c-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="c-notes">Notat</Label>
              <Textarea
                id="c-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          {selected && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Prosjekter ({selectedProjects.length})
              </Label>
              <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                {selectedProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/ks/project/${p.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {p.project_number ? `${p.project_number} · ` : ""}
                        {p.project_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(p.planned_start_date)} – {fmtDate(p.planned_end_date)}
                      </span>
                    </span>
                    <Badge variant="outline">{p.status || "–"}</Badge>
                  </button>
                ))}
                {selectedProjects.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Ingen prosjekter er knyttet til denne kunden ennå.
                  </p>
                )}
              </div>
            </div>
          )}

          {selected && customers.length > 1 && (
            <div className="space-y-2 rounded-md border p-3">
              <Label className="flex items-center gap-2">
                <Merge className="h-4 w-4" /> Slå sammen med en annen kunde
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={mergeTarget} onValueChange={setMergeTarget}>
                  <SelectTrigger className="sm:flex-1">
                    <SelectValue placeholder="Velg kunde prosjektene skal flyttes til" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers
                      .filter((c) => c.id !== selected.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!mergeTarget || mergeCustomer.isPending}
                  onClick={() => mergeCustomer.mutate()}
                >
                  Slå sammen
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Lukk
            </Button>
            <Button onClick={() => saveCustomer.mutate()} disabled={saveCustomer.isPending}>
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
