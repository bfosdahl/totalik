import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Save, 
  Loader2, 
  Building2, 
  Info, 
  Users,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrgChart, type TreeNode, PREDEFINED_ORG_ROLES } from "@/hooks/useOrgChart";
import { 
  OrgChartTree, 
  OrgChartNodeDialog, 
  OrgChartPersonDialog, 
  OrgChartMoveDialog 
} from "@/components/orgchart";
import { useIsMobile } from "@/hooks/use-mobile";

const IkHmsOrganisering = () => {
  const { profile, isSystemAdmin, isCompanyAdmin } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    nodes,
    tree,
    isLoading,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    addPerson,
    removePerson,
    setAsRoot,
  } = useOrgChart();

  // Description state (stored separately in company_organization)
  const [description, setDescription] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [isLoadingDescription, setIsLoadingDescription] = useState(true);
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // Dialog states
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [movingNode, setMovingNode] = useState<TreeNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<TreeNode | null>(null);

  // Check if user can edit (system admin, company admin, or HMS responsible)
  const canEdit = isSystemAdmin || isCompanyAdmin;

  // Fetch description from legacy company_organization table
  useEffect(() => {
    const fetchDescription = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from("company_organization")
          .select("custom_content")
          .eq("company_id", profile.company_id)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        if (data?.custom_content) {
          try {
            const parsed = JSON.parse(data.custom_content);
            setDescription(parsed.description || "");
            setOriginalDescription(parsed.description || "");
          } catch {
            setDescription(data.custom_content);
            setOriginalDescription(data.custom_content);
          }
        }
      } catch (error) {
        console.error("Error fetching description:", error);
      } finally {
        setIsLoadingDescription(false);
      }
    };

    fetchDescription();
  }, [profile?.company_id]);

  // Handle node operations
  const handleAddNode = (parentId?: string) => {
    setEditingNode(null);
    setSelectedParentId(parentId || null);
    setNodeDialogOpen(true);
  };

  const handleEditNode = (node: TreeNode) => {
    setEditingNode(node);
    setSelectedParentId(node.parent_node_id);
    setNodeDialogOpen(true);
  };

  const handleSaveNode = async (data: {
    role_title: string;
    role_description: string;
    parent_node_id: string | null;
  }) => {
    if (editingNode) {
      await updateNode.mutateAsync({
        id: editingNode.id,
        role_title: data.role_title,
        role_description: data.role_description,
        parent_node_id: data.parent_node_id,
      });
    } else {
      await createNode.mutateAsync({
        role_title: data.role_title,
        role_description: data.role_description,
        parent_node_id: data.parent_node_id,
        is_root: nodes.length === 0,
      });
    }
    setNodeDialogOpen(false);
    setEditingNode(null);
  };

  const handleDeleteNode = (node: TreeNode) => {
    setDeletingNode(node);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNode = async () => {
    if (deletingNode) {
      await deleteNode.mutateAsync(deletingNode.id);
      setDeleteDialogOpen(false);
      setDeletingNode(null);
    }
  };

  const handleAddPerson = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setPersonDialogOpen(true);
  };

  const handleSavePerson = async (personName: string) => {
    if (selectedNodeId) {
      await addPerson.mutateAsync({
        node_id: selectedNodeId,
        person_name: personName,
      });
      setPersonDialogOpen(false);
      setSelectedNodeId(null);
    }
  };

  const handleMoveNode = (node: TreeNode) => {
    setMovingNode(node);
    setMoveDialogOpen(true);
  };

  const handleConfirmMove = async (newParentId: string | null) => {
    if (movingNode) {
      await moveNode.mutateAsync({
        nodeId: movingNode.id,
        newParentId,
      });
      setMoveDialogOpen(false);
      setMovingNode(null);
    }
  };

  const handleSetRoot = async (nodeId: string) => {
    await setAsRoot.mutateAsync(nodeId);
  };

  // Save description
  const handleSaveDescription = async () => {
    if (!profile?.company_id) return;
    
    setIsSavingDescription(true);
    try {
      const content = JSON.stringify({ description });
      
      const { error } = await supabase
        .from("company_organization")
        .upsert({
          company_id: profile.company_id,
          custom_content: content,
          is_custom: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "company_id",
        });

      if (error) throw error;

      setOriginalDescription(description);
      toast.success("Beskrivelse lagret");
    } catch (error) {
      console.error("Error saving description:", error);
      toast.error("Kunne ikke lagre beskrivelse");
    } finally {
      setIsSavingDescription(false);
    }
  };

  // Generate description from org chart
  const generateDescriptionFromChart = () => {
    if (nodes.length === 0) return;
    
    const generateNodeDescription = (node: TreeNode, depth: number = 0): string => {
      const indent = '';
      const persons = node.persons?.map(p => p.person_name).join(', ') || '';
      const personText = persons ? ` (${persons})` : '';
      const desc = node.role_description ? `: ${node.role_description}` : '';
      
      let text = `${indent}**${node.role_title}**${personText}${desc}`;
      
      if (node.children.length > 0) {
        text += '\n\n' + node.children.map(c => generateNodeDescription(c, depth + 1)).join('\n\n');
      }
      
      return text;
    };
    
    const generatedText = tree.map(node => generateNodeDescription(node, 0)).join('\n\n');
    setDescription(generatedText);
    toast.success("Beskrivelse generert fra orgkart");
  };

  const hasDescriptionChanges = description !== originalDescription;

  // Find node by ID for dialogs
  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  if (isLoading || isLoadingDescription) {
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              Organisering
            </h1>
            <p className="text-muted-foreground mt-1">
              HMS-organisasjon med hierarkisk struktur
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => handleAddNode()}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til rolle
            </Button>
          )}
        </div>

        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chart">Organisasjonskart</TabsTrigger>
            <TabsTrigger value="description">Beskrivelse</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Bygg et hierarkisk organisasjonskart. Klikk på en node for å legge til underordnede, 
                tilknytte personer eller flytte den i hierarkiet.
              </AlertDescription>
            </Alert>

            {/* Quick add predefined roles */}
            {canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hurtiglegg til roller</CardTitle>
                  <CardDescription>Velg forhåndsdefinerte roller med standardbeskrivelser</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_ORG_ROLES.map((role) => {
                      const isAlreadyAdded = nodes.some(n => n.role_title === role.title);
                      return (
                        <Button
                          key={role.title}
                          variant={isAlreadyAdded ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            createNode.mutate({
                              role_title: role.title,
                              role_description: role.description,
                              is_root: nodes.length === 0,
                            });
                          }}
                          disabled={createNode.isPending}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {role.title}
                          {isAlreadyAdded && " ✓"}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organization Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Organisasjonskart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrgChartTree
                  tree={tree}
                  onEdit={handleEditNode}
                  onDelete={handleDeleteNode}
                  onAddChild={handleAddNode}
                  onAddPerson={handleAddPerson}
                  onMove={handleMoveNode}
                  onSetRoot={handleSetRoot}
                  canEdit={canEdit}
                  isMobile={isMobile ?? false}
                />
              </CardContent>
            </Card>

            {/* Persons list */}
            {nodes.some(n => n.persons && n.persons.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tilknyttede personer</CardTitle>
                  <CardDescription>Oversikt over hvem som er tilknyttet hver rolle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nodes.filter(n => n.persons && n.persons.length > 0).map(node => (
                      <div key={node.id} className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm min-w-[150px]">{node.role_title}:</span>
                        {node.persons?.map(person => (
                          <div 
                            key={person.id} 
                            className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                          >
                            <span>{person.person_name}</span>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => removePerson.mutate(person.id)}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="description" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Her kan du skrive en generell beskrivelse av hvordan HMS-arbeidet er organisert i bedriften.
                Denne teksten vises i HMS-håndboken.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Organisasjonsbeskrivelse</CardTitle>
                    <CardDescription>
                      Beskriv bedriftens organisering av HMS-arbeidet
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {nodes.length > 0 && (
                      <Button variant="outline" size="sm" onClick={generateDescriptionFromChart}>
                        Generer fra orgkart
                      </Button>
                    )}
                    {hasDescriptionChanges && (
                      <Button 
                        size="sm" 
                        onClick={handleSaveDescription}
                        disabled={isSavingDescription}
                      >
                        {isSavingDescription ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Lagre
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beskriv hvordan bedriften er organisert med hensyn til HMS-arbeid. Hvem har ansvar for hva? Hvordan er rapporteringslinjene?"
                  rows={12}
                  className="resize-none"
                  disabled={!canEdit}
                />
              </CardContent>
            </Card>

            {/* Preview of org chart */}
            {nodes.length > 0 && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Forhåndsvisning av orgkart</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {nodes.map((node) => (
                    <div key={node.id}>
                      <p>
                        <strong>{node.role_title}</strong>
                        {node.persons && node.persons.length > 0 && (
                          <span className="text-muted-foreground">
                            {' '}({node.persons.map(p => p.person_name).join(', ')})
                          </span>
                        )}
                        {node.role_description && (
                          <>: {node.role_description}</>
                        )}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <OrgChartNodeDialog
          open={nodeDialogOpen}
          onOpenChange={setNodeDialogOpen}
          onSave={handleSaveNode}
          nodes={nodes}
          editingNode={editingNode}
          defaultParentId={selectedParentId}
          isLoading={createNode.isPending || updateNode.isPending}
        />

        <OrgChartPersonDialog
          open={personDialogOpen}
          onOpenChange={setPersonDialogOpen}
          onSave={handleSavePerson}
          nodeTitle={selectedNodeId ? getNodeById(selectedNodeId)?.role_title || '' : ''}
          isLoading={addPerson.isPending}
        />

        <OrgChartMoveDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          onMove={handleConfirmMove}
          nodes={nodes}
          movingNode={movingNode}
          isLoading={moveNode.isPending}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Slett node
              </AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette "{deletingNode?.role_title}"?
                {deletingNode?.children && deletingNode.children.length > 0 && (
                  <span className="block mt-2 font-medium text-destructive">
                    Advarsel: Denne noden har {deletingNode.children.length} underordnede som vil bli løsrevet fra hierarkiet.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteNode}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default IkHmsOrganisering;
