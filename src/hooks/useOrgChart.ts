import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface OrgChartNodePerson {
  id: string;
  node_id: string;
  person_name: string;
  person_email: string | null;
  profile_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface OrgChartNode {
  id: string;
  company_id: string;
  parent_node_id: string | null;
  role_title: string;
  role_description: string | null;
  sort_order: number;
  is_root: boolean;
  created_at: string;
  updated_at: string;
  persons?: OrgChartNodePerson[];
  children?: OrgChartNode[];
}

export interface TreeNode extends OrgChartNode {
  children: TreeNode[];
  depth: number;
}

// Predefined role templates with standard HMS responsibilities
export const PREDEFINED_ORG_ROLES = [
  {
    title: "Daglig leder",
    description: "Daglig leder har det overordnede ansvaret for at gjeldende lover, forskrifter og interne retningslinjer etterleves."
  },
  {
    title: "HMS-ansvarlig",
    description: "HMS-ansvarlig koordinerer det daglige HMS-arbeidet og har ansvar for å følge opp at rutiner og tiltak gjennomføres."
  },
  {
    title: "Arbeidsleder",
    description: "Arbeidsleder har ansvar for å iverksette og følge opp nødvendige tiltak innen sine ansvarsområder."
  },
  {
    title: "Verneombud",
    description: "Verneombudet fungerer som arbeidstakernes valgte representant i spørsmål knyttet til arbeidsmiljø og sikkerhet."
  },
  {
    title: "Salgssjef",
    description: "Salgssjef har ansvar for salgsavdelingen og rapporterer til daglig leder."
  },
  {
    title: "Prosjektleder",
    description: "Prosjektleder har ansvar for gjennomføring av prosjekter og HMS på sine prosjekter."
  },
  {
    title: "Avdelingsleder",
    description: "Avdelingsleder har ansvar for sin avdeling og personalansvaret for ansatte i avdelingen."
  },
  {
    title: "Øvrige ansatte",
    description: "Alle ansatte har en plikt til å følge virksomhetens HMS-rutiner og bidra aktivt til et trygt arbeidsmiljø."
  },
];

export const useOrgChart = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  // Fetch all nodes with persons
  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['org-chart-nodes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data: nodesData, error: nodesError } = await supabase
        .from('org_chart_nodes')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order');
      
      if (nodesError) throw nodesError;
      
      const { data: personsData, error: personsError } = await supabase
        .from('org_chart_node_persons')
        .select('*')
        .in('node_id', nodesData?.map(n => n.id) || [])
        .order('sort_order');
      
      if (personsError) throw personsError;
      
      // Attach persons to their nodes
      const nodesWithPersons = nodesData?.map(node => ({
        ...node,
        persons: personsData?.filter(p => p.node_id === node.id) || []
      })) || [];
      
      return nodesWithPersons as OrgChartNode[];
    },
    enabled: !!companyId,
  });

  // Build tree structure from flat nodes
  const buildTree = (nodes: OrgChartNode[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];
    
    // First pass: create TreeNode objects
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [], depth: 0 });
    });
    
    // Second pass: build parent-child relationships
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!;
      if (node.parent_node_id && nodeMap.has(node.parent_node_id)) {
        const parent = nodeMap.get(node.parent_node_id)!;
        parent.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });
    
    // Calculate depths
    const setDepths = (node: TreeNode, depth: number) => {
      node.depth = depth;
      node.children
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach(child => setDepths(child, depth + 1));
    };
    
    roots.sort((a, b) => a.sort_order - b.sort_order);
    roots.forEach(root => setDepths(root, 0));
    
    return roots;
  };

  const tree = buildTree(nodes);

  // Create node
  const createNode = useMutation({
    mutationFn: async (data: {
      role_title: string;
      role_description?: string;
      parent_node_id?: string | null;
      is_root?: boolean;
    }) => {
      if (!companyId) throw new Error('No company ID');
      
      // Get max sort_order for siblings
      const siblings = nodes.filter(n => n.parent_node_id === data.parent_node_id);
      const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) : -1;
      
      const { data: result, error } = await supabase
        .from('org_chart_nodes')
        .insert({
          company_id: companyId,
          role_title: data.role_title,
          role_description: data.role_description || null,
          parent_node_id: data.parent_node_id || null,
          is_root: data.is_root || false,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
      toast.success('Node opprettet');
    },
    onError: (error: any) => {
      console.error('Error creating node:', error);
      if (error.message?.includes('Circular reference')) {
        toast.error('Kan ikke opprette sirkulær referanse');
      } else {
        toast.error('Kunne ikke opprette node');
      }
    },
  });

  // Update node
  const updateNode = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OrgChartNode> & { id: string }) => {
      const { data, error } = await supabase
        .from('org_chart_nodes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
      toast.success('Node oppdatert');
    },
    onError: (error: any) => {
      console.error('Error updating node:', error);
      if (error.message?.includes('Circular reference')) {
        toast.error('Kan ikke opprette sirkulær referanse i hierarkiet');
      } else {
        toast.error('Kunne ikke oppdatere node');
      }
    },
  });

  // Delete node
  const deleteNode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('org_chart_nodes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
      toast.success('Node slettet');
    },
    onError: () => toast.error('Kunne ikke slette node'),
  });

  // Move node to new parent
  const moveNode = useMutation({
    mutationFn: async ({ nodeId, newParentId }: { nodeId: string; newParentId: string | null }) => {
      // Get siblings at new location
      const newSiblings = nodes.filter(n => n.parent_node_id === newParentId && n.id !== nodeId);
      const maxOrder = newSiblings.length > 0 ? Math.max(...newSiblings.map(s => s.sort_order)) : -1;
      
      const { data, error } = await supabase
        .from('org_chart_nodes')
        .update({ 
          parent_node_id: newParentId,
          sort_order: maxOrder + 1
        })
        .eq('id', nodeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
      toast.success('Node flyttet');
    },
    onError: (error: any) => {
      if (error.message?.includes('Circular reference')) {
        toast.error('Kan ikke flytte node under seg selv eller sine underordnede');
      } else {
        toast.error('Kunne ikke flytte node');
      }
    },
  });

  // Add person to node
  const addPerson = useMutation({
    mutationFn: async (data: {
      node_id: string;
      person_name: string;
      person_email?: string;
      profile_id?: string;
    }) => {
      const existingPersons = nodes.find(n => n.id === data.node_id)?.persons || [];
      const maxOrder = existingPersons.length > 0 ? Math.max(...existingPersons.map(p => p.sort_order)) : -1;
      
      const { data: result, error } = await supabase
        .from('org_chart_node_persons')
        .insert({
          node_id: data.node_id,
          person_name: data.person_name,
          person_email: data.person_email || null,
          profile_id: data.profile_id || null,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
      toast.success('Person tilknyttet');
    },
    onError: () => toast.error('Kunne ikke tilknytte person'),
  });

  // Remove person from node
  const removePerson = useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase
        .from('org_chart_node_persons')
        .delete()
        .eq('id', personId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
      toast.success('Person fjernet');
    },
    onError: () => toast.error('Kunne ikke fjerne person'),
  });

  // Set as root node
  const setAsRoot = useMutation({
    mutationFn: async (nodeId: string) => {
      // First, unset any existing root
      await supabase
        .from('org_chart_nodes')
        .update({ is_root: false })
        .eq('company_id', companyId)
        .eq('is_root', true);
      
      // Set new root
      const { data, error } = await supabase
        .from('org_chart_nodes')
        .update({ is_root: true, parent_node_id: null })
        .eq('id', nodeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
      toast.success('Toppnode satt');
    },
    onError: () => toast.error('Kunne ikke sette toppnode'),
  });

  // Reorder siblings
  const reorderNodes = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('org_chart_nodes')
          .update({ sort_order: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
    },
  });

  return {
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
    reorderNodes,
  };
};
