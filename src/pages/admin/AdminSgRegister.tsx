import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Building2, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Award,
  RefreshCw,
  AlertCircle,
  Link2
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkSgDialog } from "@/components/admin/LinkSgDialog";

interface SGEnterprise {
  name: string;
  organizational_number: string;
  exp_date: Date | null;
  email?: string;
  phone?: string;
  businessaddress: {
    line_1?: string;
    postal_town?: string;
  };
  valid_approval_areas: Array<{
    subject_area: string;
  }>;
  status: {
    approved: boolean;
    approval_period_to: string;
  };
}

export default function AdminSgRegister() {
  const [enterprises, setEnterprises] = useState<SGEnterprise[]>([]);
  const [filteredEnterprises, setFilteredEnterprises] = useState<SGEnterprise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<SGEnterprise | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  // Fetch companies for linking
  const { data: companies } = useQuery({
    queryKey: ["admin-companies-sg"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, org_number, sg_approved, sg_expiry_date")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const fetchSgData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://sgregister.dibk.no/api/enterprises.json', {
        headers: { 'Accept': 'application/vnd.sgpub.v2' }
      });

      if (!response.ok) throw new Error(`API feil: ${response.status}`);

      const data = await response.json();
      const approved = data.enterprises.filter((e: any) => e.status.approved);

      // Parse expiry dates
      const withDates = approved.map((e: any) => ({
        ...e,
        exp_date: e.status.approval_period_to ? new Date(e.status.approval_period_to) : null
      }));

      // Filter future expiry dates and sort
      const currentDate = new Date();
      const futureExp = withDates.filter((e: SGEnterprise) => 
        e.exp_date && e.exp_date > currentDate
      );

      const sorted = futureExp.sort((a, b) => {
        if (!a.exp_date || !b.exp_date) return 0;
        return a.exp_date.getTime() - b.exp_date.getTime();
      });

      setEnterprises(sorted);
      setFilteredEnterprises(sorted.slice(0, 50)); // Show top 50 by default
      setHasFetched(true);
      
      toast({
        title: "Data hentet",
        description: `${sorted.length} godkjente bedrifter lastet inn`,
      });
    } catch (error) {
      toast({
        title: "Feil ved henting",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrregInfo = async (orgnr: string): Promise<{ email: string; phone: string }> => {
    try {
      const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgnr}`);
      if (!response.ok) throw new Error('Brreg feil');
      
      const data = await response.json();
      return {
        email: data.epostadresse || 'Ikke oppgitt',
        phone: data.telefon || data.mobil || 'Ikke oppgitt'
      };
    } catch (error) {
      return { email: 'Ikke tilgjengelig', phone: 'Ikke tilgjengelig' };
    }
  };

  const searchEntries = () => {
    const query = searchQuery.trim().toLowerCase();
    let results = [...enterprises];

    // Date filter
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      results = results.filter(e => {
        if (!e.exp_date) return false;
        return (
          e.exp_date.getFullYear() === filterDate.getFullYear() &&
          e.exp_date.getMonth() === filterDate.getMonth() &&
          e.exp_date.getDate() === filterDate.getDate()
        );
      });
    }

    // Search filter
    if (query && query !== 'alle') {
      results = results.filter(e =>
        e.name.toLowerCase().includes(query) || 
        e.organizational_number.includes(query)
      );
    } else if (query === 'alle') {
      results = results.slice(0, 50);
    }

    setFilteredEnterprises(results);
  };

  const handleLinkToCompany = (enterprise: SGEnterprise) => {
    // Try to find matching company by org number
    const matchingCompany = companies?.find(c => 
      c.org_number === enterprise.organizational_number
    );
    
    if (matchingCompany) {
      setSelectedCompanyId(matchingCompany.id);
    }
    setSelectedEnterprise(enterprise);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">SG Register Søk</h1>
          <p className="text-muted-foreground mt-1">
            Søk i Sentral Godkjenning registeret fra Direktoratet for byggkvalitet
          </p>
        </div>

        {/* Fetch Button */}
        {!hasFetched && (
          <Card>
            <CardHeader>
              <CardTitle>Hent SG-data</CardTitle>
              <CardDescription>
                Klikk for å laste inn godkjente bedrifter fra SG-registeret
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fetchSgData} 
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Henter data...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Hent SG-data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        {hasFetched && (
          <Card>
            <CardHeader>
              <CardTitle>Søk og filtrer</CardTitle>
              <CardDescription>
                Søk etter navn, org.nr. eller "alle" for topp 50 som utløper snart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk etter navn eller org.nr..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setTimeout(searchEntries, 100);
                    }}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setTimeout(searchEntries, 100);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Totalt godkjente: {enterprises.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Viser: {filteredEnterprises.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {hasFetched && (
          <Card>
            <CardHeader>
              <CardTitle>Resultater</CardTitle>
              <CardDescription>
                {filteredEnterprises.length > 0 
                  ? `${filteredEnterprises.length} bedrifter funnet`
                  : "Ingen bedrifter funnet"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEnterprises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Ingen treff. Prøv et annet søk.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredEnterprises.map((enterprise, idx) => (
                    <EnterpriseCard 
                      key={`${enterprise.organizational_number}-${idx}`}
                      enterprise={enterprise}
                      fetchBrregInfo={fetchBrregInfo}
                      onLinkToCompany={handleLinkToCompany}
                      companies={companies || []}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Link Dialog */}
      {selectedEnterprise && selectedCompanyId && (
        <LinkSgDialog
          open={!!selectedEnterprise}
          onOpenChange={(open) => !open && setSelectedEnterprise(null)}
          companyId={selectedCompanyId}
          companyName={companies?.find(c => c.id === selectedCompanyId)?.name || ""}
          sgEnterprise={selectedEnterprise}
          onLinked={() => {
            setSelectedEnterprise(null);
            toast({
              title: "Suksess",
              description: "SG-godkjenning er nå koblet til bedriften",
            });
          }}
        />
      )}
    </AdminLayout>
  );
}

interface EnterpriseCardProps {
  enterprise: SGEnterprise;
  fetchBrregInfo: (orgnr: string) => Promise<{ email: string; phone: string }>;
  onLinkToCompany: (enterprise: SGEnterprise) => void;
  companies: Array<{ id: string; name: string; org_number: string | null; sg_approved: boolean | null }>;
}

function EnterpriseCard({ enterprise, fetchBrregInfo, onLinkToCompany, companies }: EnterpriseCardProps) {
  const [contactInfo, setContactInfo] = useState<{ email: string; phone: string } | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const matchingCompany = companies.find(c => 
    c.org_number === enterprise.organizational_number
  );
  const isLinked = matchingCompany?.sg_approved;

  const handleLoadContact = async () => {
    if (contactInfo || loadingContact) return;
    
    setLoadingContact(true);
    const info = await fetchBrregInfo(enterprise.organizational_number);
    setContactInfo(info);
    setLoadingContact(false);
  };

  // Auto-load if missing email/phone
  useState(() => {
    if (!enterprise.email || !enterprise.phone) {
      handleLoadContact();
    }
  });

  const displayEmail = enterprise.email || contactInfo?.email || 'Laster...';
  const displayPhone = enterprise.phone || contactInfo?.phone || 'Laster...';

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{enterprise.name}</h3>
            {isLinked && (
              <Badge variant="default" className="bg-green-600">
                <Link2 className="w-3 h-3 mr-1" />
                Koblet til {matchingCompany?.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Org.nr: {enterprise.organizational_number}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {enterprise.exp_date && (
            <Badge variant="outline" className="shrink-0">
              <Calendar className="w-3 h-3 mr-1" />
              {format(enterprise.exp_date, "d. MMM yyyy", { locale: nb })}
            </Badge>
          )}
          {matchingCompany && !isLinked && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onLinkToCompany(enterprise)}
              className="gap-1"
            >
              <Link2 className="w-3 h-3" />
              Koble til bedrift
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <span>
            {enterprise.businessaddress.line_1 || 'Ikke oppgitt'}, {enterprise.businessaddress.postal_town || 'Ikke oppgitt'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className={loadingContact ? "text-muted-foreground animate-pulse" : ""}>
            {displayEmail}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className={loadingContact ? "text-muted-foreground animate-pulse" : ""}>
            {displayPhone}
          </span>
        </div>

        {enterprise.valid_approval_areas.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="font-medium mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Godkjenningsområder:
            </p>
            <div className="flex flex-wrap gap-1">
              {enterprise.valid_approval_areas.map((area, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {area.subject_area}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
