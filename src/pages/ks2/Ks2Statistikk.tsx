import { motion } from "framer-motion";
import { 
  BarChart3, 
  ClipboardCheck, 
  AlertTriangle, 
  Shield, 
  Building2,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  Loader2,
  FolderOpen,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useKsModule2Statistics } from "@/hooks/useKsModule2Statistics";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ['hsl(217, 71%, 45%)', 'hsl(152, 44%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(199, 89%, 48%)'];

export default function Ks2Statistikk() {
  const { data: stats, isLoading, error } = useKsModule2Statistics();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Kunne ikke laste statistikk</p>
      </div>
    );
  }

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
    return monthNames[parseInt(m) - 1];
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Statistikk og KPI-er</h1>
          <p className="text-muted-foreground mt-1">Oversikt over alle KS-prosjekter</p>
        </div>
        <Badge variant="outline" className="w-fit">
          <BarChart3 className="h-3.5 w-3.5 mr-1" />
          {stats.totalProjects} prosjekter totalt
        </Badge>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Projects KPI */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktive prosjekter</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.activeProjects}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Badge variant="secondary">{stats.completedProjects} fullført</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Checklists KPI */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sjekklister</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.completedChecklists}/{stats.totalChecklists}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2 text-sm mb-1">
                <span className="text-muted-foreground">Fullføringsgrad</span>
                <span className="font-medium">{stats.checklistCompletionRate}%</span>
              </div>
              <Progress value={stats.checklistCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Deviations KPI */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avvik</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.openDeviations}</p>
                <p className="text-xs text-muted-foreground">åpne av {stats.totalDeviations}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2 text-sm mb-1">
                <span className="text-muted-foreground">Lukkingsgrad</span>
                <span className="font-medium">{stats.deviationClosureRate}%</span>
              </div>
              <Progress value={stats.deviationClosureRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Safety Rounds KPI */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vernerunder</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.completedVernerunder}/{stats.totalVernerunder}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2 text-sm mb-1">
                <span className="text-muted-foreground">Gjennomføringsgrad</span>
                <span className="font-medium">{stats.vernerundeCompletionRate}%</span>
              </div>
              <Progress value={stats.vernerundeCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Deviation Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Avvikstrend</CardTitle>
            <CardDescription>Åpnede og lukkede avvik siste 6 måneder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.deviationTrend.map(d => ({ ...d, month: formatMonth(d.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="opened" 
                    stroke="hsl(38, 92%, 50%)" 
                    strokeWidth={2}
                    name="Åpnet"
                    dot={{ fill: 'hsl(38, 92%, 50%)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="closed" 
                    stroke="hsl(152, 44%, 42%)" 
                    strokeWidth={2}
                    name="Lukket"
                    dot={{ fill: 'hsl(152, 44%, 42%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Checklists by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Sjekklister per måned</CardTitle>
            <CardDescription>Fullførte og totale sjekklister</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] sm:h-[300px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.checklistsByMonth.map(d => ({ ...d, month: formatMonth(d.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(217, 71%, 45%)" name="Totalt" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(152, 44%, 42%)" name="Fullført" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Deviations by Category and Project Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Deviations by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Avvik per kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.deviationsByCategory.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.deviationsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="category"
                      label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {stats.deviationsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Ingen avvik registrert</p>
            )}
          </CardContent>
        </Card>

        {/* Project Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Prosjektoversikt</CardTitle>
              <CardDescription>Status per prosjekt</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/ks')}>
              Se alle
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Prosjekt</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Sjekklister</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Avvik</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Vernerunder</th>
                    <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.projectStats.slice(0, 5).map((project) => (
                    <tr 
                      key={project.id} 
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/ks/project/${project.id}`)}
                    >
                      <td className="py-3">
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{project.project_name}</p>
                          <p className="text-xs text-muted-foreground">{project.project_number}</p>
                        </div>
                      </td>
                      <td className="text-center py-3">
                        <span className="text-green-600 font-medium">{project.completed_checklists}</span>
                        <span className="text-muted-foreground">/{project.checklist_count}</span>
                      </td>
                      <td className="text-center py-3">
                        {project.open_deviations > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {project.open_deviations} åpne
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">0 åpne</Badge>
                        )}
                      </td>
                      <td className="text-center py-3">
                        <span className="text-blue-600 font-medium">{project.completed_vernerunder}</span>
                        <span className="text-muted-foreground">/{project.vernerunder_count}</span>
                      </td>
                      <td className="text-center py-3">
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status === 'active' ? 'Aktiv' : project.status === 'completed' ? 'Fullført' : project.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {stats.projectStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Ingen prosjekter funnet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Underleverandører</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalSubcontractors}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Gjennomsnitt fullføring</span>
                </div>
                <p className="text-2xl font-bold">{stats.checklistCompletionRate}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm">Åpne avvik</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{stats.openDeviations}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Lukkede avvik</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.closedDeviations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
