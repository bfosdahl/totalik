import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Move, 
  UserPlus,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/hooks/useOrgChart';

interface OrgChartTreeProps {
  tree: TreeNode[];
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onAddChild: (parentId: string) => void;
  onAddPerson: (nodeId: string) => void;
  onMove: (node: TreeNode) => void;
  onSetRoot: (nodeId: string) => void;
  canEdit: boolean;
  isMobile?: boolean;
}

const OrgChartTree: React.FC<OrgChartTreeProps> = ({
  tree,
  onEdit,
  onDelete,
  onAddChild,
  onAddPerson,
  onMove,
  onSetRoot,
  canEdit,
  isMobile = false,
}) => {
  if (tree.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Ingen noder i orgkartet ennå</p>
        <p className="text-sm mt-2">Legg til roller for å bygge organisasjonskartet</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-2">
        {tree.map(node => (
          <MobileNode 
            key={node.id} 
            node={node}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onAddPerson={onAddPerson}
            onMove={onMove}
            onSetRoot={onSetRoot}
            canEdit={canEdit}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex flex-col items-center min-w-max">
        {tree.map((node, index) => (
          <React.Fragment key={node.id}>
            {index > 0 && tree.length > 1 && (
              <div className="w-px h-4 bg-border" />
            )}
            <TreeNodeComponent 
              node={node}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onAddPerson={onAddPerson}
              onMove={onMove}
              onSetRoot={onSetRoot}
              canEdit={canEdit}
              isRoot
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

interface TreeNodeProps {
  node: TreeNode;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onAddChild: (parentId: string) => void;
  onAddPerson: (nodeId: string) => void;
  onMove: (node: TreeNode) => void;
  onSetRoot: (nodeId: string) => void;
  canEdit: boolean;
  isRoot?: boolean;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  onEdit,
  onDelete,
  onAddChild,
  onAddPerson,
  onMove,
  onSetRoot,
  canEdit,
  isRoot = false,
}) => {
  const hasChildren = node.children.length > 0;
  
  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <NodeCard 
        node={node}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddChild={onAddChild}
        onAddPerson={onAddPerson}
        onMove={onMove}
        onSetRoot={onSetRoot}
        canEdit={canEdit}
        isRoot={isRoot && node.is_root}
      />
      
      {/* Children */}
      {hasChildren && (
        <>
          {/* Vertical connector from parent */}
          <div className="w-px h-6 bg-border" />
          
          {/* Horizontal connector for multiple children */}
          {node.children.length > 1 && (
            <div 
              className="h-px bg-border" 
              style={{ 
                width: `calc(${(node.children.length - 1) * 220}px + 100%)`,
                maxWidth: `${(node.children.length - 1) * 280}px`,
                minWidth: `${(node.children.length - 1) * 180}px`
              }}
            />
          )}
          
          {/* Child nodes */}
          <div className="flex gap-4 mt-0">
            {node.children.map((child, index) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Vertical connector to child */}
                <div className="w-px h-6 bg-border" />
                <TreeNodeComponent 
                  node={child}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  onAddPerson={onAddPerson}
                  onMove={onMove}
                  onSetRoot={onSetRoot}
                  canEdit={canEdit}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface NodeCardProps {
  node: TreeNode;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onAddChild: (parentId: string) => void;
  onAddPerson: (nodeId: string) => void;
  onMove: (node: TreeNode) => void;
  onSetRoot: (nodeId: string) => void;
  canEdit: boolean;
  isRoot?: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  onEdit,
  onDelete,
  onAddChild,
  onAddPerson,
  onMove,
  onSetRoot,
  canEdit,
  isRoot = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative group bg-background border-2 rounded-lg shadow-sm min-w-[180px] max-w-[240px]",
        isRoot ? "border-primary" : "border-border",
        "hover:shadow-md transition-shadow"
      )}
    >
      {isRoot && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Topp
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{node.role_title}</h4>
            
            {/* Persons list */}
            {node.persons && node.persons.length > 0 && (
              <div className="mt-2 space-y-1">
                {node.persons.map(person => (
                  <div key={person.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{person.person_name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {(!node.persons || node.persons.length === 0) && (
              <p className="text-xs text-muted-foreground/60 mt-1 italic">Ingen tilknyttet</p>
            )}
          </div>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddPerson(node.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tilknytt person
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til underordnet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(node)}>
                  <Move className="h-4 w-4 mr-2" />
                  Flytt node
                </DropdownMenuItem>
                {!node.is_root && (
                  <DropdownMenuItem onClick={() => onSetRoot(node.id)}>
                    <Crown className="h-4 w-4 mr-2" />
                    Sett som toppnode
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(node)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Mobile-friendly collapsible node
interface MobileNodeProps {
  node: TreeNode;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onAddChild: (parentId: string) => void;
  onAddPerson: (nodeId: string) => void;
  onMove: (node: TreeNode) => void;
  onSetRoot: (nodeId: string) => void;
  canEdit: boolean;
  depth?: number;
}

const MobileNode: React.FC<MobileNodeProps> = ({
  node,
  onEdit,
  onDelete,
  onAddChild,
  onAddPerson,
  onMove,
  onSetRoot,
  canEdit,
  depth = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div 
        className={cn(
          "border rounded-lg p-3 bg-background",
          node.is_root && "border-primary"
        )}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {!hasChildren && <div className="w-6" />}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {node.is_root && <Crown className="h-4 w-4 text-primary flex-shrink-0" />}
              <span className="font-medium text-sm truncate">{node.role_title}</span>
            </div>
            {node.persons && node.persons.length > 0 && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {node.persons.map(p => p.person_name).join(', ')}
              </div>
            )}
          </div>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddPerson(node.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tilknytt person
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til underordnet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(node)}>
                  <Move className="h-4 w-4 mr-2" />
                  Flytt
                </DropdownMenuItem>
                {!node.is_root && (
                  <DropdownMenuItem onClick={() => onSetRoot(node.id)}>
                    <Crown className="h-4 w-4 mr-2" />
                    Sett som topp
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(node)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2 border-l-2 border-border ml-3"
          >
            {node.children.map(child => (
              <MobileNode
                key={child.id}
                node={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onAddPerson={onAddPerson}
                onMove={onMove}
                onSetRoot={onSetRoot}
                canEdit={canEdit}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrgChartTree;
