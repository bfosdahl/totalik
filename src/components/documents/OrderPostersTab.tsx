import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, CheckCircle2, Package } from "lucide-react";

const categoryLabels: Record<string, string> = {
  hygiene: "Hygiene",
  temperatur: "Temperatur",
  renhold: "Renhold",
  allergen: "Allergener",
  mottak: "Varemottak",
  oppbevaring: "Oppbevaring",
  general: "Generelt",
};

const categoryColors: Record<string, string> = {
  hygiene: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  temperatur: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  renhold: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  allergen: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  mottak: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  oppbevaring: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export function OrderPostersTab() {
  const { company, profile } = useAuth();
  const [selectedPosters, setSelectedPosters] = useState<Set<string>>(new Set());
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    if (profile) {
      setContactName(`${profile.first_name || ""} ${profile.last_name || ""}`.trim());
      setContactEmail(profile.email || "");
    }
  }, [profile]);

  const { data: posters, isLoading } = useQuery({
    queryKey: ["ik-mat-poster-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ik_mat_poster_catalog")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const togglePoster = (title: string) => {
    setSelectedPosters(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const selectAll = () => {
    if (!posters) return;
    if (selectedPosters.size === posters.length) {
      setSelectedPosters(new Set());
    } else {
      setSelectedPosters(new Set(posters.map(p => p.title)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPosters.size === 0) {
      toast.error("Velg minst én plakat");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ik-mat-order-posters", {
        body: {
          companyName: company?.name || "Ukjent bedrift",
          contactName,
          contactEmail,
          contactPhone,
          selectedPosters: Array.from(selectedPosters),
          message,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOrderSent(true);
      toast.success("Bestillingen er sendt!");
    } catch (err: any) {
      toast.error("Kunne ikke sende bestilling: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orderSent) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
        <h2 className="text-2xl font-bold">Bestilling sendt!</h2>
        <p className="text-muted-foreground">
          Din bestilling av {selectedPosters.size} {selectedPosters.size === 1 ? "plakat/dokument" : "plakater/dokumenter"} er sendt.
          Vi tar kontakt på <strong>{contactEmail}</strong> med informasjon om levering.
        </p>
        <Button variant="outline" onClick={() => { setOrderSent(false); setSelectedPosters(new Set()); }}>
          Bestill flere
        </Button>
      </div>
    );
  }

  const grouped = posters?.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof posters>) || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Tilgjengelige plakater og dokumenter
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={selectAll}>
              {selectedPosters.size === posters?.length ? "Fjern alle" : "Velg alle"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <Badge className={`mb-3 ${categoryColors[category] || categoryColors.general}`}>
                {categoryLabels[category] || category}
              </Badge>
              <div className="space-y-2">
                {items.map((poster) => (
                  <label
                    key={poster.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPosters.has(poster.title)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedPosters.has(poster.title)}
                      onCheckedChange={() => togglePoster(poster.title)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">{poster.title}</p>
                      {poster.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{poster.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Kontaktinformasjon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kontaktperson *</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>E-post *</Label>
              <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Valgfritt" />
          </div>
          <div className="space-y-2">
            <Label>Melding / spesielle ønsker</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="F.eks. antall eksemplarer, spesielle formater, leveringsadresse..." rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedPosters.size} {selectedPosters.size === 1 ? "valgt" : "valgte"}
        </p>
        <Button type="submit" size="lg" className="gap-2" disabled={isSending || selectedPosters.size === 0}>
          {isSending ? (
            <>Sender bestilling...</>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send bestilling
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
