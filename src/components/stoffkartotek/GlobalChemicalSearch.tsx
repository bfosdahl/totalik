import { useState } from "react";
import { Search, Plus, FlaskConical, Building2, FileText, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchGlobalChemicals, GlobalChemicalWithSds } from "@/hooks/useGlobalChemicalRegistry";
import { cn } from "@/lib/utils";

interface GlobalChemicalSearchProps {
  onSelectChemical: (chemical: GlobalChemicalWithSds) => void;
  onCreateNew: (searchQuery: string) => void;
  excludeIds?: string[]; // IDs of chemicals already in company registry
}

// Danger class colors
const getDangerClassColor = (dangerClass: string): string => {
  const classColors: Record<string, string> = {
    "Brannfarlig": "bg-orange-100 text-orange-800 border-orange-300",
    "Oksiderende": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "Eksplosiv": "bg-red-100 text-red-800 border-red-300",
    "Giftig": "bg-purple-100 text-purple-800 border-purple-300",
    "Etsende": "bg-rose-100 text-rose-800 border-rose-300",
    "Irriterende": "bg-amber-100 text-amber-800 border-amber-300",
    "Helseskadelig": "bg-pink-100 text-pink-800 border-pink-300",
    "Miljøskadelig": "bg-green-100 text-green-800 border-green-300",
    "Gass under trykk": "bg-blue-100 text-blue-800 border-blue-300",
  };
  return classColors[dangerClass] || "bg-gray-100 text-gray-800 border-gray-300";
};

export const GlobalChemicalSearch = ({ 
  onSelectChemical, 
  onCreateNew,
  excludeIds = []
}: GlobalChemicalSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults = [], isLoading } = useSearchGlobalChemicals(
    searchQuery,
    isSearching && searchQuery.length >= 2
  );

  // Filter out chemicals already in company registry
  const filteredResults = searchResults.filter(
    chemical => !excludeIds.includes(chemical.id)
  );

  const handleSearch = () => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter produktnavn, CAS-nummer eller produsent..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.length < 2) {
                setIsSearching(false);
              }
            }}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={searchQuery.length < 2}>
          Søk
        </Button>
      </div>

      {/* Search results */}
      {isSearching && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Søkeresultater
            </CardTitle>
            <CardDescription>
              {isLoading 
                ? "Søker i det globale registeret..." 
                : `${filteredResults.length} stoffer funnet${excludeIds.length > 0 ? ` (${searchResults.length - filteredResults.length} allerede i kartoteket)` : ""}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredResults.map(chemical => (
                    <div
                      key={chemical.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                      onClick={() => onSelectChemical(chemical)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{chemical.product_name}</span>
                          {chemical.current_sds && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              <FileText className="h-3 w-3 mr-1" />
                              SDS
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                          {chemical.manufacturer && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {chemical.manufacturer}
                            </span>
                          )}
                          {chemical.cas_number && (
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              CAS: {chemical.cas_number}
                            </span>
                          )}
                        </div>

                        {chemical.danger_classes && chemical.danger_classes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {chemical.danger_classes.slice(0, 4).map((dc, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className={cn("text-xs", getDangerClassColor(dc))}
                              >
                                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                {dc}
                              </Badge>
                            ))}
                            {chemical.danger_classes.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{chemical.danger_classes.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Legg til
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-6">
                <FlaskConical className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Ingen stoffer funnet for "{searchQuery}"
                </p>
                <Button onClick={() => onCreateNew(searchQuery)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett nytt stoff
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Create new option when not searching */}
      {!isSearching && searchQuery.length >= 2 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Opprett nytt stoff</p>
                <p className="text-sm text-muted-foreground">
                  Legg til et stoff som ikke finnes i registeret
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => onCreateNew(searchQuery)}>
              Opprett
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Initial state hint */}
      {!isSearching && searchQuery.length < 2 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Skriv minst 2 tegn for å søke i det globale stoffregisteret
          </p>
          <p className="text-xs mt-1">
            Du kan søke på produktnavn, CAS-nummer eller produsent
          </p>
        </div>
      )}
    </div>
  );
};
