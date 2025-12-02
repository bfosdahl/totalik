import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKsProjects } from "@/hooks/useKsProjects";
import { useKsSubcontractors } from "@/hooks/useKsSubcontractors";
import { Building2, Phone, Mail, FileText, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

export default function KsSubcontractorOverview() {
  const { projects } = useKsProjects();
  const [activeTab, setActiveTab] = useState("all");

  return (
    <AppLayout>
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-3xl font-bold">Underleverandører (UE)</h1>
          <p className="text-muted-foreground">
            Oversikt over alle underleverandører i dine prosjekter
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Alle UE</TabsTrigger>
            <TabsTrigger value="godkjent">Godkjent</TabsTrigger>
            <TabsTrigger value="til_vurdering">Til vurdering</TabsTrigger>
            <TabsTrigger value="ikke_godkjent">Ikke godkjent</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {projects?.map((project) => (
              <SubcontractorsByProject 
                key={project.id} 
                projectId={project.id} 
                projectName={project.name} 
              />
            ))}
          </TabsContent>

          <TabsContent value="godkjent" className="space-y-4 mt-6">
            {projects?.map((project) => (
              <SubcontractorsByProject 
                key={project.id} 
                projectId={project.id} 
                projectName={project.name}
                filterStatus="godkjent"
              />
            ))}
          </TabsContent>

          <TabsContent value="til_vurdering" className="space-y-4 mt-6">
            {projects?.map((project) => (
              <SubcontractorsByProject 
                key={project.id} 
                projectId={project.id} 
                projectName={project.name}
                filterStatus="pending"
              />
            ))}
          </TabsContent>

          <TabsContent value="ikke_godkjent" className="space-y-4 mt-6">
            {projects?.map((project) => (
              <SubcontractorsByProject 
                key={project.id} 
                projectId={project.id} 
                projectName={project.name}
                filterStatus="ikke_godkjent"
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function SubcontractorsByProject({ 
  projectId, 
  projectName,
  filterStatus 
}: { 
  projectId: string; 
  projectName: string;
  filterStatus?: string;
}) {
  const navigate = useNavigate();
  const { subcontractors, isLoading } = useKsSubcontractors(projectId);

  const filteredSubcontractors = filterStatus
    ? subcontractors?.filter(sub => sub.approval_status === filterStatus)
    : subcontractors;

  if (isLoading) {
    return null;
  }

  if (!filteredSubcontractors || filteredSubcontractors.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {projectName}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/ks/projects/${projectId}/ue`)}
          >
            Gå til prosjekt
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredSubcontractors.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/ks/projects/${projectId}/ue`)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h4 className="font-semibold">{sub.subcontractor_name}</h4>
                  <Badge variant="outline">{sub.work_scope}</Badge>
                  {sub.approval_status === "godkjent" && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Godkjent
                    </Badge>
                  )}
                  {sub.approval_status === "pending" && (
                    <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <Clock className="w-3 h-3 mr-1" />
                      Til vurdering
                    </Badge>
                  )}
                  {sub.approval_status === "ikke_godkjent" && (
                    <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                      <XCircle className="w-3 h-3 mr-1" />
                      Ikke godkjent
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {sub.contact_person && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {sub.contact_person}
                    </span>
                  )}
                  {sub.contact_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {sub.contact_phone}
                    </span>
                  )}
                  {sub.contact_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {sub.contact_email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
