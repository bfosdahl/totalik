import { motion } from "framer-motion";
import { Building2, Users, Shield, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [companiesResult, profilesResult] = await Promise.all([
        supabase.from("companies").select("id, status", { count: "exact" }),
        supabase.from("profiles").select("id, is_active", { count: "exact" }),
      ]);

      const activeCompanies = companiesResult.data?.filter(c => c.status === "active").length || 0;
      const totalCompanies = companiesResult.count || 0;
      const activeUsers = profilesResult.data?.filter(p => p.is_active).length || 0;
      const totalUsers = profilesResult.count || 0;

      return {
        totalCompanies,
        activeCompanies,
        totalUsers,
        activeUsers,
      };
    },
  });

  const statCards = [
    {
      icon: Building2,
      label: "Bedrifter",
      value: stats?.totalCompanies ?? 0,
      subtext: `${stats?.activeCompanies ?? 0} aktive`,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Users,
      label: "Brukere",
      value: stats?.totalUsers ?? 0,
      subtext: `${stats?.activeUsers ?? 0} aktive`,
      color: "bg-accent/10 text-accent",
    },
    {
      icon: Shield,
      label: "Systemadmins",
      value: 1,
      subtext: "Med full tilgang",
      color: "bg-warning/10 text-warning",
    },
    {
      icon: Activity,
      label: "Systemstatus",
      value: "OK",
      subtext: "Alle systemer opererer normalt",
      color: "bg-success/10 text-success",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Systemadministrasjon og oversikt
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl border border-border p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {stat.subtext}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <h2 className="font-semibold mb-4">Hurtighandlinger</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              to="/admin/companies"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            >
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Opprett ny bedrift</p>
                <p className="text-xs text-muted-foreground">Legg til ny kunde</p>
              </div>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            >
              <Users className="w-5 h-5 text-accent" />
              <div>
                <p className="font-medium">Administrer brukere</p>
                <p className="text-xs text-muted-foreground">Se alle brukere</p>
              </div>
            </Link>
            <Link
              to="/admin/companies"
              className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            >
              <Shield className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium">Administrer bedrifter</p>
                <p className="text-xs text-muted-foreground">Status og lisenser</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
