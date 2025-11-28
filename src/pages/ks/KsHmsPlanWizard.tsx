import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useKsHmsPlan } from "@/hooks/useKsHmsPlan";
import { KsHmsGoalsStep } from "@/components/ks/hms/KsHmsGoalsStep";
import { KsHmsOrganizationStep } from "@/components/ks/hms/KsHmsOrganizationStep";
import { KsHmsRiskAssessmentStep } from "@/components/ks/hms/KsHmsRiskAssessmentStep";
import { KsHmsSjaStep } from "@/components/ks/hms/KsHmsSjaStep";
import { KsHmsActionPlanStep } from "@/components/ks/hms/KsHmsActionPlanStep";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const steps = [
  { id: "goals", title: "HMS-mål", description: "Definer HMS-målene for prosjektet" },
  { id: "organization", title: "Organisering", description: "Definer prosjektorganisering og roller" },
  { id: "risks", title: "Risikovurdering", description: "Identifiser og vurder risikoer" },
  { id: "sja", title: "Sikker Jobb Analyse", description: "Opprett SJA for kritiske arbeidsoppgaver" },
  { id: "actions", title: "Handlingsplan", description: "Definer tiltak og ansvar" },
];

export default function KsHmsPlanWizard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { 
    goals, 
    organization, 
    risks, 
    actions, 
    sjaList, 
    progress, 
    isLoading,
    saveProgress,
    saveGoals,
    saveOrganization,
    saveRisks,
    saveActions,
    createSja,
  } = useKsHmsPlan(projectId || null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const { data, error } = await supabase
          .from('ks_projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Kunne ikke hente prosjekt');
        navigate('/ks/projects');
      }
    };

    fetchProject();
  }, [projectId, navigate]);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIndex(progress.current_step);
    }
  }, [progress, isLoading]);

  const handleNext = async () => {
    const nextStep = currentStepIndex + 1;
    const currentStepId = steps[currentStepIndex].id;
    
    // Mark current step as completed
    const newCompletedSteps = [...progress.completed_steps];
    if (!newCompletedSteps.includes(currentStepId)) {
      newCompletedSteps.push(currentStepId);
    }

    if (nextStep < steps.length) {
      await saveProgress({
        current_step: nextStep,
        completed_steps: newCompletedSteps,
      });
      setCurrentStepIndex(nextStep);
    } else {
      // Complete wizard
      await saveProgress({
        current_step: nextStep,
        completed_steps: newCompletedSteps,
        is_completed: true,
      });
      toast.success('HMS-plan fullført!');
      navigate(`/ks/projects/${projectId}`);
    }
  };

  const handlePrevious = async () => {
    const prevStep = currentStepIndex - 1;
    if (prevStep >= 0) {
      await saveProgress({ current_step: prevStep });
      setCurrentStepIndex(prevStep);
    }
  };

  const handleStepClick = async (index: number) => {
    await saveProgress({ current_step: index });
    setCurrentStepIndex(index);
  };

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  if (isLoading || !project) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  const currentStep = steps[currentStepIndex];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/ks/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">HMS-plan</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Fremdrift</CardTitle>
            <CardDescription>
              Steg {currentStepIndex + 1} av {steps.length}: {currentStep.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Steps Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isCompleted = progress.completed_steps.includes(step.id);
            const isCurrent = index === currentStepIndex;
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap
                  ${isCurrent 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : isCompleted
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    : "bg-background border-border hover:bg-muted"
                  }
                `}
              >
                {isCompleted && <Check className="h-4 w-4" />}
                <span className="text-sm font-medium">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{currentStep.title}</CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep.id === "goals" && (
              <KsHmsGoalsStep 
                goals={goals} 
                onSave={saveGoals}
              />
            )}
            {currentStep.id === "organization" && (
              <KsHmsOrganizationStep 
                organization={organization} 
                onSave={saveOrganization}
              />
            )}
            {currentStep.id === "risks" && (
              <KsHmsRiskAssessmentStep 
                risks={risks} 
                onSave={saveRisks}
              />
            )}
            {currentStep.id === "sja" && (
              <KsHmsSjaStep 
                sjaList={sjaList} 
                onCreate={createSja}
              />
            )}
            {currentStep.id === "actions" && (
              <KsHmsActionPlanStep 
                actions={actions}
                risks={risks}
                onSave={saveActions}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Forrige
              </Button>
              <Button onClick={handleNext}>
                {currentStepIndex === steps.length - 1 ? "Fullfør" : "Neste"}
                {currentStepIndex < steps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}