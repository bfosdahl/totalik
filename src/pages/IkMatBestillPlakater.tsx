import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
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
import { Printer, ShoppingCart, Send, CheckCircle2, Package } from "lucide-react";

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

export default function IkMatBestillPlakater() {
  const { company, profile } = useAuth();
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const [selectedPosters, setSelectedPosters] = useState<Set<string>>(new Set());
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

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

  if (modulesLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (orderSent) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto py-16 text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
          <h1 className="text-3xl font-bold">Bestilling sendt!</h1>
          <p className="text-muted-foreground">
            Din bestilling av {selectedPosters.size} {selectedPosters.size === 1 ? "plakat/dokument" : "plakater/dokumenter"} er sendt. 
            Vi tar kontakt på <strong>{contactEmail}</strong> med informasjon om levering.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setOrderSent(false); setSelectedPosters(new Set()); }}>
              Bestill flere
            </Button>
            <Button onClick={() => navigate("/ik-mat/kontroll")}>
              Tilbake til kontroll
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Group by category
  const grouped = posters?.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof posters>) || {};

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Printer className="h-8 w-8 text-primary" />
            Bestill plakater og skjema
          </h1>
          <p className="text-muted-foreground mt-1">
            Velg plakater og utskriftsdokumenter du ønsker å motta for bruk på kjøkkenet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poster selection */}
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

          {/* Contact info */}
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

          {/* Submit */}
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
      </div>
    </AppLayout>
  );
}
