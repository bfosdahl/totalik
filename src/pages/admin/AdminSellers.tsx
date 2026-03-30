import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, UserCheck, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  seller_id: string | null;
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [sellersRes, companiesRes] = await Promise.all([
      supabase.from("sellers").select("*").order("name"),
      supabase.from("companies").select("id, name, seller_id").order("name"),
    ]);
    if (sellersRes.data) setSellers(sellersRes.data);
    if (companiesRes.data) setCompanies(companiesRes.data as Company[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Navn og e-post er påkrevd");
      return;
    }
    setSaving(true);
    try {
      if (editingSeller) {
        const { error } = await supabase
          .from("sellers")
          .update({ name: name.trim(), email: email.trim(), phone: phone.trim() || null })
          .eq("id", editingSeller.id);
        if (error) throw error;
        toast.success("Selger oppdatert");
      } else {
        const { error } = await supabase
          .from("sellers")
          .insert({ name: name.trim(), email: email.trim(), phone: phone.trim() || null });
        if (error) throw error;
        toast.success("Selger opprettet");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Feil ved lagring");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne selgeren?")) return;
    const { error } = await supabase.from("sellers").delete().eq("id", id);
    if (error) {
      toast.error("Kunne ikke slette selger");
    } else {
      toast.success("Selger slettet");
      fetchData();
    }
  };

  const handleAssignSeller = async (companyId: string, sellerId: string | null) => {
    const { error } = await supabase
      .from("companies")
      .update({ seller_id: sellerId === "none" ? null : sellerId })
      .eq("id", companyId);
    if (error) {
      toast.error("Kunne ikke tilknytte selger");
    } else {
      toast.success("Selger tilknyttet");
      fetchData();
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setEditingSeller(null);
  };

  const openEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setName(seller.name);
    setEmail(seller.email);
    setPhone(seller.phone || "");
    setDialogOpen(true);
  };

  const getSellerCompanyCount = (sellerId: string) =>
    companies.filter((c) => c.seller_id === sellerId).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              Selgere
            </h1>
            <p className="text-muted-foreground">Administrer selgere og tilknytt dem til bedrifter</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ny selger
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSeller ? "Rediger selger" : "Ny selger"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Navn</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fullt navn" />
                </div>
                <div className="space-y-2">
                  <Label>E-post</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="epost@firma.no" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Telefon (valgfritt)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="12345678" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingSeller ? "Lagre endringer" : "Opprett selger"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sellers list */}
        <Card>
          <CardHeader>
            <CardTitle>Selgeroversikt</CardTitle>
          </CardHeader>
          <CardContent>
            {sellers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen selgere opprettet ennå</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Kunder</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getSellerCompanyCount(s.id)} bedrifter</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Company-seller mapping */}
        <Card>
          <CardHeader>
            <CardTitle>Bedrift-selger tilknytning</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bedrift</TableHead>
                  <TableHead>Selger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Select
                        value={c.seller_id || "none"}
                        onValueChange={(val) => handleAssignSeller(c.id, val)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Velg selger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ingen selger</SelectItem>
                          {sellers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
