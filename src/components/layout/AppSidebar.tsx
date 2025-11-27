import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  FileCheck,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ClipboardList, label: "Oppsett", path: "/setup" },
  { icon: AlertTriangle, label: "Avvik", path: "/deviations" },
  { icon: FileCheck, label: "Revisjoner", path: "/audits" },
  { icon: BookOpen, label: "Handbok", path: "/handbook" },
  { icon: Settings, label: "Innstillinger", path: "/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span className="font-bold text-sidebar-foreground text-lg tracking-tight">
                Internkontroll
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                HMS · MAT · BYGG
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Company selector */}
      <div className="px-3 py-4 border-b border-sidebar-border">
        <button className={cn(
          "flex items-center gap-3 w-full p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors",
          collapsed && "justify-center"
        )}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
            <Building2 className="w-4 h-4 text-sidebar-primary" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-start text-left min-w-0"
              >
                <span className="text-sm font-medium text-sidebar-foreground truncate w-full">
                  Demo Bedrift AS
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  Org: 123 456 789
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                collapsed && "justify-center",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-transform",
                !isActive && "group-hover:scale-110"
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Minimer</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
