import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { toast } from "sonner";
import { t } from "@/i18n/t";

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
    description: t("auto.daglig_leder_har_det_overordnede_ansvare_2")
  },
  {
    title: "HMS-ansvarlig",
    description: t("auto.hms_ansvarlig_koordinerer_det_daglige_hm_2")
  },
  {
    title: "Arbeidsleder",
    description: t("auto.arbeidsleder_har_ansvar_for_aa_iverksett")
  },
  {
    title: "Verneombud",
    description: t("auto.verneombudet_fungerer_som_arbeidstakerne")
  },
  {
    title: "Salgssjef",
    description: t("auto.salgssjef_har_ansvar_for_salgsavdelingen")
  },
  {
    title: "Prosjektleder",
    description: t("auto.prosjektleder_har_ansvar_for_gjennomfoer")
  },
  {
    title: "Avdelingsleder",
    description: t("auto.avdelingsleder_har_ansvar_for_sin_avdeli")
  },
  {
    title: "Øvrige ansatte",
    description: t("auto.alle_ansatte_har_en_plikt_til_aa_foelge_")
  },
];

export const useOrgChart = () => {
  const { profile } = useAuth();
  const { filterDepartmentId } = useDepartmentContext();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  // Fetch all nodes with persons
  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['org-chart-nodes', companyId, filterDepartmentId],
    queryFn: async () => {
      if (!companyId) return [];
      
      let nq = supabase
        .from('org_chart_nodes')
        .select('*')
        .eq('company_id', companyId);
      nq = filterDepartmentId
        ? nq.eq('department_id', filterDepartmentId)
        : nq.is('department_id', null);
      const { data: nodesData, error: nodesError } = await nq.order('sort_order');
      
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
          department_id: filterDepartmentId,
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
      const { persons, children, ...rest } = updates as any;
      const { data, error } = await supabase
        .from('org_chart_nodes')
        .update(rest as any)
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

  // Silent update for role descriptions (no toast)
  const updateNodeSilent = async (id: string, role_description: string) => {
    const { error } = await supabase
      .from('org_chart_nodes')
      .update({ role_description })
      .eq('id', id);
    
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['org-chart-nodes'] });
  };

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
      // First, unset any existing root (in same scope)
      let rq = supabase
        .from('org_chart_nodes')
        .update({ is_root: false })
        .eq('company_id', companyId)
        .eq('is_root', true);
      rq = filterDepartmentId
        ? rq.eq('department_id', filterDepartmentId)
        : rq.is('department_id', null);
      await rq;
      
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
    updateNodeSilent,
    deleteNode,
    moveNode,
    addPerson,
    removePerson,
    setAsRoot,
    reorderNodes,
  };
};
