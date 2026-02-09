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
    <div className="overflow-x-auto pb-8 pt-6">
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
          <div className="w-0.5 h-8 bg-gradient-to-b from-border to-border/50" />
          
          {/* Horizontal connector for multiple children */}
          {node.children.length > 1 && (
            <div 
              className="h-0.5 bg-border/70 rounded-full" 
              style={{ 
                width: `calc(${(node.children.length - 1) * 280}px)`,
              }}
            />
          )}
          
          {/* Child nodes */}
          <div className="flex gap-6 mt-0">
            {node.children.map((child, index) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Vertical connector to child */}
                <div className="w-0.5 h-8 bg-gradient-to-b from-border/50 to-border" />
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
  const personCount = node.persons?.length || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative group bg-card border-2 rounded-xl shadow-md min-w-[220px] max-w-[300px]",
        isRoot ? "border-primary bg-primary/5 shadow-primary/10" : "border-border",
        "hover:shadow-lg hover:border-primary/50 transition-all duration-200"
      )}
    >
      {isRoot && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <Crown className="h-3.5 w-3.5" />
          Toppnode
        </div>
      )}
      
      <div className="p-5">
        {/* Role title - larger and more prominent */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base leading-tight text-foreground">
              {node.role_title}
            </h4>
          </div>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(node)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Rediger rolle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddPerson(node.id)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Tilknytt person
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAddChild(node.id)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Legg til underordnet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(node)} className="gap-2">
                  <Move className="h-4 w-4" />
                  Flytt i hierarkiet
                </DropdownMenuItem>
                {!node.is_root && (
                  <DropdownMenuItem onClick={() => onSetRoot(node.id)} className="gap-2">
                    <Crown className="h-4 w-4" />
                    Sett som toppnode
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(node)}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Slett rolle
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Persons section - more visible */}
        <div className="mt-4 pt-3 border-t border-border/50">
          {personCount > 0 ? (
            <div className="space-y-2">
              {node.persons!.map(person => (
                <div 
                  key={person.id} 
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate">{person.person_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => canEdit && onAddPerson(node.id)}
              className={cn(
                "w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-dashed border-muted-foreground/30",
                canEdit && "hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors",
                !canEdit && "cursor-default"
              )}
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {canEdit ? "Tilknytt person" : "Ingen tilknyttet"}
              </span>
            </button>
          )}
        </div>
        
        {/* Quick add child button for easier use */}
        {canEdit && (
          <button
            onClick={() => onAddChild(node.id)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Legg til underordnet
          </button>
        )}
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
  const personCount = node.persons?.length || 0;
  
  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div 
        className={cn(
          "border-2 rounded-xl bg-card shadow-sm",
          node.is_root ? "border-primary bg-primary/5" : "border-border"
        )}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 p-3 pb-2">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <div className="w-8" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {node.is_root && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  <Crown className="h-3 w-3" />
                </span>
              )}
              <span className="font-bold text-base truncate">{node.role_title}</span>
            </div>
          </div>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-9 w-9 flex-shrink-0">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(node)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Rediger rolle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddPerson(node.id)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Tilknytt person
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAddChild(node.id)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Legg til underordnet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(node)} className="gap-2">
                  <Move className="h-4 w-4" />
                  Flytt i hierarkiet
                </DropdownMenuItem>
                {!node.is_root && (
                  <DropdownMenuItem onClick={() => onSetRoot(node.id)} className="gap-2">
                    <Crown className="h-4 w-4" />
                    Sett som toppnode
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(node)}
                  className="text-destructive focus:text-destructive gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Slett rolle
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Persons section */}
        <div className="px-3 pb-3 ml-8">
          {personCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {node.persons!.map(person => (
                <div 
                  key={person.id} 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/70 text-sm"
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{person.person_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => canEdit && onAddPerson(node.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed border-muted-foreground/30 text-sm text-muted-foreground",
                canEdit && "hover:border-primary hover:text-primary transition-colors"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {canEdit ? "Tilknytt" : "Ingen"}
            </button>
          )}
          
          {hasChildren && (
            <div className="text-xs text-muted-foreground mt-2">
              {node.children.length} underordnet{node.children.length !== 1 ? 'e' : ''}
            </div>
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
