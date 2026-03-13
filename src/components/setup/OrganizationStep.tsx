import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Check, Info, Plus, ChevronUp, ChevronDown, Trash2, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserSelect from "@/components/audits/UserSelect";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PREDEFINED_ORG_ROLES } from "@/hooks/useOrgChart";
import { toast } from "sonner";

export interface OrganizationStepRef {
  save: () => Promise<void>;
  hasData: () => boolean;
}

interface SetupRole {
  id: string; // org_chart_nodes id or temp id
  nodeId?: string; // actual DB id if exists
  title: string;
  personName: string;
  description: string;
  sortOrder: number;
  parentNodeId: string | null;
  isNew?: boolean;
}

export interface OrganizationData {
  roles: { id: string; title: string; personName: string; description: string; sortOrder: number }[];
  description: string;
}

// Legacy interface for backwards compatibility
interface LegacyOrganizationData {
  template_id: string | null;
  custom_content: string;
  is_custom: boolean;
}

// Use the same predefined roles as the Organisering page
const SETUP_PREDEFINED_ROLES = PREDEFINED_ORG_ROLES.filter(r => 
  ["Daglig leder", "HMS-ansvarlig", "Arbeidsleder", "Verneombud", "Øvrige ansatte"].includes(r.title)
);

interface OrganizationStepProps {
  existingData?: OrganizationData | LegacyOrganizationData;
  onSave: (data: OrganizationData | LegacyOrganizationData) => Promise<void>;
  isSaving: boolean;
}

export const OrganizationStep = forwardRef<OrganizationStepRef, OrganizationStepProps>(
  function OrganizationStep({ existingData, onSave, isSaving }, ref) {
    const { profile } = useAuth();
    const companyId = profile?.company_id;
    const [roles, setRoles] = useState<SetupRole[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoadingNodes, setIsLoadingNodes] = useState(true);
    const [loadedFromNodes, setLoadedFromNodes] = useState(false);

    // Load from org_chart_nodes (the real source of truth)
    useEffect(() => {
      if (!companyId) {
        setIsLoadingNodes(false);
        return;
      }

      const loadFromOrgChart = async () => {
        setIsLoadingNodes(true);
        try {
          const { data: nodesData, error: nodesError } = await supabase
            .from('org_chart_nodes')
            .select('*')
            .eq('company_id', companyId)
            .order('sort_order');

          if (nodesError) throw nodesError;

          if (nodesData && nodesData.length > 0) {
            // Load persons
            const { data: personsData } = await supabase
              .from('org_chart_node_persons')
              .select('*')
              .in('node_id', nodesData.map(n => n.id))
              .order('sort_order');

            // Build flat ordered list by traversing tree
            const nodeMap = new Map(nodesData.map(n => [n.id, n]));
            const childrenMap = new Map<string | null, typeof nodesData>();
            nodesData.forEach(n => {
              const key = n.parent_node_id;
              if (!childrenMap.has(key)) childrenMap.set(key, []);
              childrenMap.get(key)!.push(n);
            });

            const flatRoles: SetupRole[] = [];
            const traverse = (parentId: string | null, depth: number) => {
              const children = childrenMap.get(parentId) || [];
              children.sort((a, b) => a.sort_order - b.sort_order);
              for (const node of children) {
                const persons = personsData?.filter(p => p.node_id === node.id) || [];
                flatRoles.push({
                  id: node.id,
                  nodeId: node.id,
                  title: node.role_title,
                  personName: persons.map(p => p.person_name).join(', '),
                  description: node.role_description || '',
                  sortOrder: flatRoles.length,
                  parentNodeId: node.parent_node_id,
                });
                traverse(node.id, depth + 1);
              }
            };
            traverse(null, 0);

            setRoles(flatRoles);
            setLoadedFromNodes(true);
          } else if (existingData) {
            // Fallback: load from legacy company_organization data
            if ('roles' in existingData && Array.isArray(existingData.roles)) {
              setRoles(existingData.roles.map((r, i) => ({
                ...r,
                parentNodeId: null,
                isNew: true,
                sortOrder: i,
              })));
            } else if ('custom_content' in existingData && existingData.custom_content) {
              try {
                const parsed = JSON.parse(existingData.custom_content);
                if (parsed.roles && Array.isArray(parsed.roles)) {
                  setRoles(parsed.roles.map((r: any, i: number) => ({
                    id: r.id || `role-${Date.now()}-${i}`,
                    title: r.title || '',
                    personName: r.personName || '',
                    description: r.description || '',
                    sortOrder: i,
                    parentNodeId: null,
                    isNew: true,
                  })));
                }
              } catch { /* ignore */ }
            }
          }
        } catch (error) {
          console.error("Error loading org chart nodes:", error);
        } finally {
          setIsLoadingNodes(false);
        }
      };

      loadFromOrgChart();
    }, [companyId]);

    const handleAddRole = (predefinedTitle?: string) => {
      const predefined = predefinedTitle
        ? PREDEFINED_ORG_ROLES.find(r => r.title === predefinedTitle)
        : null;

      const newRole: SetupRole = {
        id: `new-${Date.now()}`,
        title: predefined?.title || "",
        personName: "",
        description: predefined?.description || "",
        sortOrder: roles.length,
        parentNodeId: roles.length > 0 ? (roles[0].nodeId || roles[0].id) : null,
        isNew: true,
      };
      setRoles([...roles, newRole]);
      setHasChanges(true);
    };

    const handleSelectPredefinedRole = (roleId: string, predefinedTitle: string) => {
      const predefined = PREDEFINED_ORG_ROLES.find(r => r.title === predefinedTitle);
      if (predefined) {
        setRoles(roles.map(r =>
          r.id === roleId
            ? { ...r, title: predefined.title, description: predefined.description }
            : r
        ));
        setHasChanges(true);
      }
    };

    const handleUpdateRole = (id: string, field: keyof SetupRole, value: string) => {
      setRoles(roles.map(r => r.id === id ? { ...r, [field]: value } : r));
      setHasChanges(true);
    };

    const handleDeleteRole = (id: string) => {
      setRoles(roles.filter(r => r.id !== id));
      setHasChanges(true);
    };

    const handleMoveRole = (id: string, direction: "up" | "down") => {
      const index = roles.findIndex(r => r.id === id);
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === roles.length - 1)
      ) return;

      const newRoles = [...roles];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];
      setRoles(newRoles);
      setHasChanges(true);
    };

    const handleSave = async () => {
      if (!companyId) return;

      try {
        // 1. Delete all existing org_chart_nodes for this company and recreate
        // This ensures the setup wizard and org chart page stay in sync
        const { data: existingNodes } = await supabase
          .from('org_chart_nodes')
          .select('id')
          .eq('company_id', companyId);

        if (existingNodes && existingNodes.length > 0) {
          // Delete persons first (foreign key)
          await supabase
            .from('org_chart_node_persons')
            .delete()
            .in('node_id', existingNodes.map(n => n.id));
          
          await supabase
            .from('org_chart_nodes')
            .delete()
            .eq('company_id', companyId);
        }

        // 2. Create new nodes in hierarchical order (first = root, rest = children of root)
        const createdNodeIds: string[] = [];
        let rootNodeId: string | null = null;

        for (let i = 0; i < roles.length; i++) {
          const role = roles[i];
          const parentId = i === 0 ? null : rootNodeId;

          const { data: newNode, error } = await supabase
            .from('org_chart_nodes')
            .insert({
              company_id: companyId,
              role_title: role.title,
              role_description: role.description || null,
              parent_node_id: parentId,
              is_root: i === 0,
              sort_order: i,
            })
            .select()
            .single();

          if (error) throw error;
          createdNodeIds.push(newNode.id);
          if (i === 0) rootNodeId = newNode.id;

          // Add person if specified
          if (role.personName) {
            const personNames = role.personName.split(',').map(n => n.trim()).filter(Boolean);
            for (let j = 0; j < personNames.length; j++) {
              await supabase
                .from('org_chart_node_persons')
                .insert({
                  node_id: newNode.id,
                  person_name: personNames[j],
                  sort_order: j,
                });
            }
          }
        }

        // 3. Also sync to company_organization for handbook compatibility
        const rolesForHandbook = roles.map((r, i) => ({
          title: r.title,
          personName: r.personName,
          description: r.description,
          depth: i === 0 ? 0 : 1,
          childCount: i === 0 ? roles.length - 1 : 0,
        }));

        const description = roles
          .filter(r => r.title && r.description)
          .map(r => `**${r.title}${r.personName ? ` (${r.personName})` : ''}:** ${r.description}`)
          .join('\n\n');

        const content = JSON.stringify({ description, roles: rolesForHandbook });
        await supabase
          .from("company_organization")
          .upsert({
            company_id: companyId,
            custom_content: content,
            is_custom: true,
          }, { onConflict: "company_id" });

        // 4. Notify parent
        const data: OrganizationData = { roles, description };
        await onSave(data);
        setHasChanges(false);

        // Update roles with new IDs
        setRoles(prev => prev.map((r, i) => ({
          ...r,
          nodeId: createdNodeIds[i],
          id: createdNodeIds[i],
          isNew: false,
        })));
      } catch (error) {
        console.error("Error saving organization:", error);
        toast.error("Kunne ikke lagre organisering");
      }
    };

    const hasSelection = roles.length > 0;

    useImperativeHandle(ref, () => ({
      save: handleSave,
      hasData: () => hasSelection,
    }));

    if (isLoadingNodes) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
          <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-info mb-1">Dokumenter virksomhetens organisering</p>
            <p className="text-muted-foreground">
              Velg forhåndsdefinerte roller med standardbeskrivelser, eller lag egne.
              Rollene vises i hierarkisk rekkefølge fra øverst til nederst.
              Endringer her synkroniseres med organisasjonskartet under IK/HMS → Organisering.
            </p>
          </div>
        </div>

        {/* Quick add predefined roles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Legg til rolle</CardTitle>
            <CardDescription>Velg en forhåndsdefinert rolle eller lag en egendefinert</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SETUP_PREDEFINED_ROLES.map((role) => {
                const isAlreadyAdded = roles.some(r => r.title === role.title);
                return (
                  <Button
                    key={role.title}
                    variant={isAlreadyAdded ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleAddRole(role.title)}
                    disabled={isAlreadyAdded}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {role.title}
                    {isAlreadyAdded && " ✓"}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRole()}
              >
                <Plus className="h-3 w-3 mr-1" />
                Egendefinert rolle
              </Button>
            </div>
          </CardContent>
        </Card>

        {roles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Ingen roller er definert ennå</p>
              <p className="text-sm mt-2">
                Velg forhåndsdefinerte roller ovenfor for å bygge organisasjonskartet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Visual org chart */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Organisasjonskart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2">
                  {roles.map((role, index) => (
                    <div key={role.id} className="flex flex-col items-center">
                      {index > 0 && (
                        <div className="w-0.5 h-4 bg-border" />
                      )}
                      <div className="px-6 py-3 bg-background border rounded-lg shadow-sm text-center min-w-[200px]">
                        <div className="font-semibold text-sm">{role.title || "Uten tittel"}</div>
                        {role.personName && (
                          <div className="text-xs text-muted-foreground mt-1">{role.personName}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Role editing cards */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Rediger roller</h3>
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="relative">
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveRole(role.id, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveRole(role.id, "down")}
                        disabled={index === roles.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 pr-24">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <Select
                            value={PREDEFINED_ORG_ROLES.some(p => p.title === role.title) ? role.title : "custom"}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                handleUpdateRole(role.id, "title", "");
                              } else {
                                handleSelectPredefinedRole(role.id, value);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Velg rolletype" />
                            </SelectTrigger>
                            <SelectContent>
                              {PREDEFINED_ORG_ROLES.map((predefined) => (
                                <SelectItem key={predefined.title} value={predefined.title}>
                                  {predefined.title}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Egendefinert tittel</SelectItem>
                            </SelectContent>
                          </Select>
                          <UserSelect
                            value={role.personName}
                            onValueChange={(value) => handleUpdateRole(role.id, "personName", value)}
                            placeholder="Velg ansatt"
                          />
                        </div>
                      </div>
                      {!PREDEFINED_ORG_ROLES.some(p => p.title === role.title) && (
                        <div className="mt-3 pl-11">
                          <Input
                            value={role.title}
                            onChange={(e) => handleUpdateRole(role.id, "title", e.target.value)}
                            placeholder="Skriv inn egendefinert rolletittel"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={role.description}
                        onChange={(e) => handleUpdateRole(role.id, "description", e.target.value)}
                        placeholder="Beskriv ansvarsområder og oppgaver for denne rollen..."
                        rows={3}
                        className="resize-none"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Summary and save */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasSelection ? `${roles.length} rolle(r) definert` : "Velg roller for å bygge organisasjonskartet"}
          </div>
          <Button onClick={handleSave} disabled={isSaving || !hasSelection}>
            {isSaving ? "Lagrer..." : "Lagre organisering"}
          </Button>
        </div>
      </div>
    );
  }
);
