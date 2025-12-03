import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ClipboardList, 
  ListChecks, 
  Plus, 
  Upload, 
  Search,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Download
} from "lucide-react";

// Mock data for demonstration
const mockActiveChecklists = [
  { id: "1", name: "Vegger lodd og rette", status: "in_progress", responsible: "Ole Hansen", deadline: "2024-02-15", progress: 60 },
  { id: "2", name: "Isolasjon og dampsperre", status: "completed", responsible: "Kari Olsen", deadline: "2024-02-10", progress: 100 },
  { id: "3", name: "Undertak montasje", status: "planned", responsible: "Per Nilsen", deadline: "2024-02-20", progress: 0 },
];

const checklistCategories = [
  {
    id: "before",
    title: "Før prosjekt",
    description: "Tillatelser, tegninger, monteringsanvisninger",
    checklists: [
      { id: "b1", name: "Byggetillatelse og godkjenninger", selected: false },
      { id: "b2", name: "Tegninger komplett", selected: false },
      { id: "b3", name: "Monteringsanvisninger mottatt", selected: false },
      { id: "b4", name: "SHA-plan godkjent", selected: false },
      { id: "b5", name: "Rigg og drift plan", selected: false },
    ]
  },
  {
    id: "during",
    title: "Under arbeid",
    description: "Kontroll og dokumentasjon av utførelse",
    checklists: [
      { id: "d1", name: "Vegger lodd og rette", selected: false },
      { id: "d2", name: "Isolasjon og dampsperre", selected: false },
      { id: "d3", name: "Undertak montasje", selected: false },
      { id: "d4", name: "Spikerslag kjøkken/bad", selected: false },
      { id: "d5", name: "Vinduer og dører", selected: false },
      { id: "d6", name: "Elektrisk føringer", selected: false },
      { id: "d7", name: "Rør og sanitær", selected: false },
      { id: "d8", name: "Membran våtrom", selected: false },
    ]
  },
  {
    id: "final",
    title: "Sluttkontroll",
    description: "Avsluttende kontroller og uavhengig kontroll",
    checklists: [
      { id: "f1", name: "Sluttkontroll generell", selected: false },
      { id: "f2", name: "Uavhengig kontroll", selected: false },
      { id: "f3", name: "FDV-dokumentasjon komplett", selected: false },
      { id: "f4", name: "Overlevering til kunde", selected: false },
    ]
  }
];

const availableTemplates = [
  { id: "t1", name: "NS 3420 - Tømrerarbeid", category: "Tømrer", checkpoints: 15 },
  { id: "t2", name: "Våtrom NS-3600", category: "Våtrom", checkpoints: 22 },
  { id: "t3", name: "Betongstøp kontroll", category: "Betong", checkpoints: 18 },
  { id: "t4", name: "Tak og tekking", category: "Tak", checkpoints: 12 },
  { id: "t5", name: "Vinduer og dører", category: "Snekker", checkpoints: 10 },
];

export default function Ks2Sjekklister() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Fullført</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Pågår</Badge>;
      case "planned":
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Planlagt</Badge>;
      default:
        return null;
    }
  };

  const toggleCategoryChecklist = (categoryId: string, checklistId: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [checklistId]: !prev[checklistId]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sjekklister</h1>
        <p className="text-muted-foreground">Administrer prosjektets sjekklister</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="active" className="flex items-center gap-2 py-2.5">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Sjekklister</span>
          </TabsTrigger>
          <TabsTrigger value="select-type" className="flex items-center gap-2 py-2.5">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Velg typer</span>
          </TabsTrigger>
          <TabsTrigger value="choose" className="flex items-center gap-2 py-2.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Velg/Lag</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2 py-2.5">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Last opp</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Active/Completed/Planned Checklists */}
        <TabsContent value="active" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Aktive sjekklister
              </CardTitle>
              <CardDescription>Oversikt over alle sjekklister i prosjektet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Søk i sjekklister..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {mockActiveChecklists.map((checklist) => (
                  <div 
                    key={checklist.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {checklist.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : checklist.status === "in_progress" ? (
                        <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{checklist.name}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {checklist.responsible}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {checklist.deadline}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-8 sm:ml-0">
                      {checklist.status !== "planned" && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${checklist.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{checklist.progress}%</span>
                        </div>
                      )}
                      {getStatusBadge(checklist.status)}
                    </div>
                  </div>
                ))}

                {mockActiveChecklists.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Ingen sjekklister lagt til ennå</p>
                    <p className="text-sm">Gå til "Velg typer" for å velge sjekklister</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Select Checklist Types (Before/During/Final) */}
        <TabsContent value="select-type" className="mt-6">
          <div className="space-y-6">
            {checklistCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.checklists.map((checklist) => (
                      <div 
                        key={checklist.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox 
                          id={checklist.id}
                          checked={selectedCategories[checklist.id] || false}
                          onCheckedChange={() => toggleCategoryChecklist(category.id, checklist.id)}
                        />
                        <label 
                          htmlFor={checklist.id}
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {checklist.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Lagre valg
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Choose/Create Specific Checklists */}
        <TabsContent value="choose" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Velg eller lag sjekkliste
              </CardTitle>
              <CardDescription>Velg fra maler eller lag din egen sjekkliste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Søk i maler..." 
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Lag ny sjekkliste
                </Button>
              </div>

              <div className="space-y-3">
                {availableTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTemplates([...selectedTemplates, template.id]);
                          } else {
                            setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                          }
                        }}
                      />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.category} • {template.checkpoints} kontrollpunkter
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-7 sm:ml-0">
                      <Button variant="outline" size="sm">
                        Forhåndsvis
                      </Button>
                      <Button size="sm">
                        Legg til
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTemplates.length > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2">{selectedTemplates.length} sjekkliste(r) valgt</p>
                  <Button>
                    Legg til i prosjekt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Upload Own Checklists */}
        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Last opp egne sjekklister
              </CardTitle>
              <CardDescription>Last opp sjekklister du har lagret på datamaskinen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center mb-6">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">Dra og slipp filer her</p>
                <p className="text-sm text-muted-foreground mb-4">eller</p>
                <Button variant="outline">
                  Velg filer
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Støttede formater: PDF, Word, Excel
                </p>
              </div>

              {/* Uploaded paper checklists section */}
              <div className="space-y-4">
                <h3 className="font-medium">Papirbaserte sjekklister</h3>
                <p className="text-sm text-muted-foreground">
                  Sjekklister som er lastet ned for utfylling på papir må lastes opp igjen her når de er ferdig utfylt.
                </p>

                {/* Example of a downloaded checklist awaiting upload */}
                <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Vegger lodd og rette - Papirversjon #001
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Denne sjekklisten er lastet ned og må lastes opp her for at sjekklisten skal registreres som fullført.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="border-amber-300">
                          <Download className="h-4 w-4 mr-2" />
                          Last ned på nytt
                        </Button>
                        <Button size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Last opp utfylt skjema
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Another example - completed paper checklist */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Isolasjon og dampsperre - Papirversjon #002</p>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Fullført</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Opplastet 10. feb 2024 av Ole Hansen
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
