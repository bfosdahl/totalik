import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, FileText, Download, Loader2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface SubcontractorProject {
  id: string;
  project_id: string;
  subcontractor_name: string;
  work_scope: string;
  work_description: string | null;
  status: string;
  project: {
    id: string;
    name: string;
    address: string | null;
    client_name: string | null;
    status: string | null;
  };
}

export default function KsSubcontractorView() {
  const { user, profile } = useAuth();

  // Fetch subcontractor assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['subcontractor-assignments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('ks_project_subcontractors')
        .select(`
          *,
          project:ks_projects(id, name, address, client_name, status)
        `)
        .eq('user_id', profile.id)
        .eq('status', 'active');

      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-3xl font-bold">Mine prosjekter</h1>
          <p className="text-muted-foreground">
            Oversikt over prosjekter du er underleverandør på
          </p>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Du er ikke tildelt til noen prosjekter ennå</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {assignment.project.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {assignment.project.address && <span>{assignment.project.address} • </span>}
                        {assignment.project.client_name && <span>Kunde: {assignment.project.client_name}</span>}
                      </CardDescription>
                    </div>
                    <Badge>{assignment.work_scope}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="documents" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="documents">Tegninger</TabsTrigger>
                      <TabsTrigger value="info">Informasjon</TabsTrigger>
                      <TabsTrigger value="competence">Min kompetanse</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="documents" className="space-y-4 pt-4">
                      <ProjectDocuments projectId={assignment.project_id} />
                    </TabsContent>
                    
                    <TabsContent value="info" className="space-y-4 pt-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Arbeidsomfang</p>
                          <p className="text-sm">{assignment.work_scope}</p>
                        </div>
                        {assignment.work_description && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Beskrivelse</p>
                            <p className="text-sm">{assignment.work_description}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="competence" className="space-y-4 pt-4">
                      <MyCompetence subcontractorId={assignment.id} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Component to show project documents (read-only for subcontractors)
const ProjectDocuments = ({ projectId }: { projectId: string }) => {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['project-documents-readonly', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ks_project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', 'tegninger')
        .eq('is_latest_version', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const downloadDocument = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Ingen tegninger tilgjengelig</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{doc.document_name}</p>
                {doc.document_number && (
                  <Badge variant="outline" className="text-xs">{doc.document_number}</Badge>
                )}
              </div>
              {doc.description && (
                <p className="text-xs text-muted-foreground">{doc.description}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => downloadDocument(doc)}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

// Component for subcontractor to upload their own competence
const MyCompetence = ({ subcontractorId }: { subcontractorId: string }) => {
  const { data: competence = [], isLoading } = useQuery({
    queryKey: ['my-competence', subcontractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ks_subcontractor_competence')
        .select('*')
        .eq('subcontractor_id', subcontractorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (competence.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Ingen kompetansedokumenter registrert</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {competence.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{doc.document_name}</p>
              {doc.expiry_date && (
                <p className="text-xs text-muted-foreground">
                  Utløper: {format(new Date(doc.expiry_date), "d. MMM yyyy", { locale: nb })}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
