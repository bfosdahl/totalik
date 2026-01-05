import { Building2, ChevronDown, MapPin } from "lucide-react";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DepartmentSelector() {
  const {
    selectedDepartment,
    userDepartments,
    hasDepartments,
    setSelectedDepartment,
  } = useDepartmentContext();

  // Don't render if departments are not enabled or user has no departments
  if (!hasDepartments || userDepartments.length === 0) {
    return null;
  }

  // If user only has one department, just show it as a badge
  if (userDepartments.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="truncate max-w-[150px]">{userDepartments[0].name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-2 px-3 h-auto py-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm">
              {selectedDepartment?.name ?? "Alle avdelinger"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuItem
          onClick={() => setSelectedDepartment(null)}
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          <span>Alle avdelinger</span>
          {!selectedDepartment && (
            <Badge variant="secondary" className="ml-auto text-xs">
              Aktiv
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {userDepartments.map((dept) => (
          <DropdownMenuItem
            key={dept.id}
            onClick={() => setSelectedDepartment(dept)}
            className="flex flex-col items-start gap-0.5"
          >
            <div className="flex items-center gap-2 w-full">
              <span className="truncate">{dept.name}</span>
              {selectedDepartment?.id === dept.id && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Aktiv
                </Badge>
              )}
            </div>
            {dept.city && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{dept.city}</span>
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
