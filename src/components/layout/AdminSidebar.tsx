import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Oversikt", path: "/admin" },
  { icon: Building2, label: "Bedrifter", path: "/admin/companies" },
  { icon: Users, label: "Brukere", path: "/admin/users" },
];

export function AdminSidebar() {
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
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/20">
          <Shield className="w-5 h-5 text-warning" />
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
                Admin Panel
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                Systemadministrasjon
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Back to app */}
      <div className="px-3 py-4 border-b border-sidebar-border">
        <NavLink
          to="/"
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground",
            collapsed && "justify-center"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Tilbake til app
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/admin" && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                collapsed && "justify-center",
                isActive
                  ? "bg-warning text-warning-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform",
                  !isActive && "group-hover:scale-110"
                )}
              />
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
