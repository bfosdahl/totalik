import { User, LogOut, ChevronDown, Menu, Download, Building2, MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useDepartmentContext } from "@/contexts/DepartmentContext";
import { Badge } from "@/components/ui/badge";
import { Department } from "@/hooks/useDepartments";
import { LanguageSelector } from "@/components/language/LanguageSelector";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, profile, company, signOut, isSystemAdmin, isCompanyAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    selectedDepartment,
    userDepartments,
    hasDepartments,
    setSelectedDepartment,
    canViewAllDepartments,
  } = useDepartmentContext();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Handle department selection - navigate to department dashboard
  const handleSelectDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    navigate(`/avdeling/${dept.id}`);
  };

  // Handle going back to main company
  const handleSelectMainCompany = () => {
    setSelectedDepartment(null);
    // If on a department page, go to main dashboard
    if (location.pathname.startsWith("/avdeling/")) {
      navigate("/");
    }
  };

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email || "Bruker";

  const roleLabel = isSystemAdmin 
    ? "System Admin" 
    : isCompanyAdmin 
    ? "Bedriftsadmin" 
    : "Bruker";

  // Show department selector if departments are enabled and user has multiple departments (or is admin)
  const showDepartmentSelector = hasDepartments && (userDepartments.length > 1 || canViewAllDepartments);

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Department selector */}
        {showDepartmentSelector && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 max-w-[220px]">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm hidden sm:inline">
                  {selectedDepartment?.name ?? company?.name ?? "Alle avdelinger"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px]">
              {/* Hovedbedrift (Parent company) */}
              {canViewAllDepartments && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Hovedbedrift
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={handleSelectMainCompany}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4 text-primary" />
                    <span className="font-medium">{company?.name ?? "Bedrift"}</span>
                    {!selectedDepartment && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Aktiv
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Avdelinger */}
              {userDepartments.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Avdelinger
                  </DropdownMenuLabel>
                  {userDepartments.map((dept) => (
                    <DropdownMenuItem
                      key={dept.id}
                      onClick={() => handleSelectDepartment(dept)}
                      className="flex flex-col items-start gap-0.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{dept.name}</span>
                        {selectedDepartment?.id === dept.id && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Aktiv
                          </Badge>
                        )}
                      </div>
                      {dept.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-6">
                          <MapPin className="h-3 w-3" />
                          <span>{dept.city}</span>
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Single department badge (when user has exactly one) */}
        {hasDepartments && userDepartments.length === 1 && !canViewAllDepartments && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md bg-muted/30">
            <Building2 className="h-4 w-4" />
            <span className="truncate max-w-[120px]">{userDepartments[0].name}</span>
          </div>
        )}

        {/* Language selector */}
        <LanguageSelector variant="icon" />

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{roleLabel}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings?tab=security")}>
              <User className="w-4 h-4 mr-2" />
              Min profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/install")}>
              <Download className="w-4 h-4 mr-2" />
              Last ned app
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logg ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
