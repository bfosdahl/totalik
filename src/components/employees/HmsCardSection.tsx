import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Edit2, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle,
  Send
} from "lucide-react";
import { Employee, useUpdateEmployee } from "@/hooks/useEmployees";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface HmsCardSectionProps {
  employee: Employee;
  canManage: boolean;
}

export function HmsCardSection({ employee, canManage }: HmsCardSectionProps) {
  const { profile, company } = useAuth();
  const updateEmployee = useUpdateEmployee();
  const [isEditing, setIsEditing] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpNotes, setHelpNotes] = useState("");
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

  const [editData, setEditData] = useState({
    hms_card_required: employee.hms_card_required || false,
    hms_card_obtained: employee.hms_card_obtained || false,
    hms_card_number: employee.hms_card_number || "",
    hms_card_expiry_date: employee.hms_card_expiry_date || "",
  });

  const handleSave = () => {
    updateEmployee.mutate({
      id: employee.id,
      hms_card_required: editData.hms_card_required,
      hms_card_obtained: editData.hms_card_obtained,
      hms_card_number: editData.hms_card_number || null,
      hms_card_expiry_date: editData.hms_card_expiry_date || null,
    }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancel = () => {
    setEditData({
      hms_card_required: employee.hms_card_required || false,
      hms_card_obtained: employee.hms_card_obtained || false,
      hms_card_number: employee.hms_card_number || "",
      hms_card_expiry_date: employee.hms_card_expiry_date || "",
    });
    setIsEditing(false);
  };

  const handleRequestHelp = async () => {
    if (!company?.id || !profile) return;
    
    setIsSubmittingHelp(true);
    try {
      const { error } = await supabase
        .from("hms_card_requests")
        .insert({
          company_id: company.id,
          employee_id: employee.id,
          notes: helpNotes || null,
          requested_by: profile.id,
          requested_by_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Ukjent",
        });

      if (error) throw error;

      toast({ 
        title: "Forespørsel sendt", 
        description: "Vi tar kontakt snarest for å hjelpe med HMS-kort" 
      });
      setShowHelpDialog(false);
      setHelpNotes("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ukjent feil";
      toast({ 
        title: "Feil", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  const getHmsCardStatus = () => {
    if (!employee.hms_card_required) {
      return { label: "Ikke påkrevd", variant: "secondary" as const, icon: null };
    }
    if (!employee.hms_card_obtained) {
      return { label: "Mangler", variant: "destructive" as const, icon: AlertCircle };
    }
    if (employee.hms_card_expiry_date) {
      const daysUntil = differenceInDays(new Date(employee.hms_card_expiry_date), new Date());
      if (daysUntil < 0) {
        return { label: "Utgått", variant: "destructive" as const, icon: AlertCircle };
      }
      if (daysUntil <= 30) {
        return { label: "Utløper snart", variant: "outline" as const, icon: AlertCircle };
      }
    }
    return { label: "Gyldig", variant: "secondary" as const, icon: CheckCircle2 };
  };

  const status = getHmsCardStatus();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              HMS-kort
            </CardTitle>
            <CardDescription>
              Lovpålagt ID-kort for mange bransjer (gyldig i 2 år)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {employee.hms_card_required && !employee.hms_card_obtained && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowHelpDialog(true)}
                className="bg-primary"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Bestill hjelp
              </Button>
            )}
            {canManage && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Rediger
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>HMS-kort påkrevd</Label>
                  <p className="text-sm text-muted-foreground">
                    Er HMS-kort lovpålagt for denne ansatte?
                  </p>
                </div>
                <Switch
                  checked={editData.hms_card_required}
                  onCheckedChange={(checked) => 
                    setEditData(prev => ({ ...prev, hms_card_required: checked }))
                  }
                />
              </div>

              {editData.hms_card_required && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>HMS-kort ordnet</Label>
                      <p className="text-sm text-muted-foreground">
                        Har den ansatte fått HMS-kort?
                      </p>
                    </div>
                    <Switch
                      checked={editData.hms_card_obtained}
                      onCheckedChange={(checked) => 
                        setEditData(prev => ({ ...prev, hms_card_obtained: checked }))
                      }
                    />
                  </div>

                  {editData.hms_card_obtained && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kortnummer</Label>
                        <Input
                          value={editData.hms_card_number}
                          onChange={(e) => setEditData(prev => ({ 
                            ...prev, 
                            hms_card_number: e.target.value 
                          }))}
                          placeholder="HMS-kortnummer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Utløpsdato</Label>
                        <Input
                          type="date"
                          value={editData.hms_card_expiry_date}
                          onChange={(e) => setEditData(prev => ({ 
                            ...prev, 
                            hms_card_expiry_date: e.target.value 
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={updateEmployee.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Lagre
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  status.variant === "destructive" ? "bg-red-500/10" :
                  status.variant === "outline" ? "bg-yellow-500/10" :
                  "bg-muted"
                }`}>
                  <CreditCard className={`w-6 h-6 ${
                    status.variant === "destructive" ? "text-red-500" :
                    status.variant === "outline" ? "text-yellow-500" :
                    "text-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">HMS-kort status</p>
                    <Badge 
                      variant={status.variant}
                      className={status.variant === "outline" ? "border-yellow-500 text-yellow-600" : ""}
                    >
                      {status.icon && <status.icon className="w-3 h-3 mr-1" />}
                      {status.label}
                    </Badge>
                  </div>
                  {employee.hms_card_required ? (
                    employee.hms_card_obtained ? (
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        {employee.hms_card_number && (
                          <p>Kortnummer: {employee.hms_card_number}</p>
                        )}
                        {employee.hms_card_expiry_date && (
                          <p>
                            Utløper: {format(new Date(employee.hms_card_expiry_date), "d. MMMM yyyy", { locale: nb })}
                            {differenceInDays(new Date(employee.hms_card_expiry_date), new Date()) <= 30 && (
                              <span className="text-yellow-600 ml-2">
                                ({differenceInDays(new Date(employee.hms_card_expiry_date), new Date())} dager igjen)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        HMS-kort er påkrevd men ikke ordnet ennå
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      HMS-kort er ikke påkrevd for denne ansatte
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Request Dialog */}
      <AlertDialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Bestill hjelp med HMS-kort
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vi hjelper deg med å bestille HMS-kort for {employee.first_name} {employee.last_name}. 
              Fyll gjerne inn informasjon som kan være nyttig.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                For å bestille HMS-kort trenger vi:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Gyldig ID (pass, førerkort eller bankkort med bilde)</li>
                <li>Bilde (selfie) av personen som skal ha kortet</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="helpNotes">Tilleggsinformasjon (valgfritt)</Label>
              <Textarea
                id="helpNotes"
                value={helpNotes}
                onChange={(e) => setHelpNotes(e.target.value)}
                placeholder="F.eks. bransje, spesielle behov, etc."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRequestHelp}
              disabled={isSubmittingHelp}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmittingHelp ? "Sender..." : "Send forespørsel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}