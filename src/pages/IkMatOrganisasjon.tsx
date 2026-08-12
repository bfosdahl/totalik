import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useIkMatContent } from "@/hooks/useIkMatContent";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, Save, Loader2, ChevronUp, ChevronDown, Info } from "lucide-react";
import UserSelect from "@/components/audits/UserSelect";
import { t } from "@/i18n/t";

// Predefined restaurant/kitchen roles with descriptions
const PREDEFINED_ROLES = [
  {
    title: t("auto.daglig_leder"),
    description: "Har det overordnede ansvaret for drift, økonomi og personale. Ansvar for HMS, IK-MAT og etterlevelse av regelverk. Kontakt med myndigheter (kommune, Mattilsynet, Arbeidstilsynet). Skal sikre at gjeldende lover og forskrifter etterleves."
  },
  {
    title: t("auto.restaurantsjef"),
    description: t("auto.ansvarlig_for_den_daglige_driften_av_res")
  },
  {
    title: t("auto.kjoekkensjef"),
    description: t("auto.har_faglig_og_operativt_ansvar_for_kjoek")
  },
  {
    title: t("auto.kokk"),
    description: t("auto.utfoerer_matproduksjon_i_henhold_til_gje")
  },
  {
    title: t("auto.hjelpekokk_kjoekkenmedarbeider"),
    description: t("auto.bistaar_kjoekkenet_med_forberedelser_enk")
  },
  {
    title: t("auto.oppvasker"),
    description: t("auto.ansvarlig_for_oppvask_renhold_og_orden_i")
  },
  {
    title: t("auto.servitoer"),
    description: t("auto.utfoerer_servering_og_kundebehandling_i_")
  },
  {
    title: t("auto.bartender"),
    description: t("auto.ansvarlig_for_servering_av_alkoholholdig")
  },
  {
    title: t("auto.runner"),
    description: t("auto.bistaar_serveringspersonalet_med_leverin")
  },
  {
    title: t("auto.gatekjoekkenmedarbeider"),
    description: t("auto.utfoerer_matlaging_kundebehandling_og_re")
  },
  {
    title: t("auto.skiftleder"),
    description: t("auto.har_ansvar_for_drift_og_ansatte_paa_eget")
  },
  {
    title: t("auto.renholder"),
    description: t("auto.utfoerer_renhold_i_henhold_til_fastsatte")
  },
  {
    title: t("auto.lageransvarlig"),
    description: t("auto.ansvarlig_for_varemottak_lagring_og_kont")
  }
];

interface OrganizationRole {
  id: string;
  title: string;
  personName: string;
  personId?: string;
  description: string;
  sortOrder: number;
}

interface IkMatOrganization {
  roles: OrganizationRole[];
}

const IkMatOrganisasjon = () => {
  const navigate = useNavigate();
  const { hasModule, isLoading: modulesLoading } = useCompanyModules();
  const { content, isLoading, isSaving, saveContent } = useIkMatContent();
  const [organization, setOrganization] = useState<IkMatOrganization>({ roles: [] });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!modulesLoading && !hasModule('IK_MAT')) {
      navigate('/');
    }
  }, [hasModule, modulesLoading, navigate]);

  useEffect(() => {
    if (!isLoading && content.organization) {
      // Handle legacy format without personName
      const roles = (content.organization.roles || []).map(role => ({
        ...role,
        personName: (role as any).personName || '',
        personId: (role as any).personId || undefined,
      }));
      setOrganization({ roles });
    }
  }, [isLoading, content.organization]);

  const handleAddRole = (predefinedTitle?: string) => {
    const predefined = predefinedTitle
      ? PREDEFINED_ROLES.find(r => r.title === predefinedTitle)
      : null;

    const newRole: OrganizationRole = {
      id: `role-${Date.now()}`,
      title: predefined?.title || '',
      personName: '',
      description: predefined?.description || '',
      sortOrder: organization.roles.length,
    };
    setOrganization({
      ...organization,
      roles: [...organization.roles, newRole],
    });
    setHasChanges(true);
  };

  const handleSelectPredefinedRole = (roleId: string, predefinedTitle: string) => {
    const predefined = PREDEFINED_ROLES.find(r => r.title === predefinedTitle);
    if (predefined) {
      setOrganization({
        ...organization,
        roles: organization.roles.map(r =>
          r.id === roleId
            ? { ...r, title: predefined.title, description: predefined.description }
            : r
        ),
      });
      setHasChanges(true);
    }
  };

  const handleUpdateRole = (id: string, field: keyof OrganizationRole, value: string) => {
    setOrganization({
      ...organization,
      roles: organization.roles.map(r =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    });
    setHasChanges(true);
  };

  const handleDeleteRole = (id: string) => {
    setOrganization({
      ...organization,
      roles: organization.roles.filter(r => r.id !== id),
    });
    setHasChanges(true);
  };

  const handleMoveRole = (id: string, direction: 'up' | 'down') => {
    const index = organization.roles.findIndex(r => r.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === organization.roles.length - 1)
    ) return;

    const newRoles = [...organization.roles];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];

    setOrganization({ ...organization, roles: newRoles });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveContent('organization', organization);
    setHasChanges(false);
  };

  if (modulesLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Organisasjonskart
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("auto.ik_mat_organisasjonsstruktur_med_roller_")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lagre
            </Button>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20">
          <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-info mb-1">{t("auto.dokumenter_virksomhetens_organisering")}</p>
            <p className="text-muted-foreground">
              {t("auto.velg_forhaandsdefinerte_roller_med_stand")}
            </p>
          </div>
        </div>

        {/* Add role button */}
        <Button onClick={() => handleAddRole()} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Legg til rolle
        </Button>

        {organization.roles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">{t("auto.ingen_roller_er_definert_ennaa")}</p>
              <p className="text-sm mt-2">
                {t("auto.velg_forhaandsdefinerte_roller_ovenfor_f")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Visual org chart */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("auto.organisasjonskart")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2">
                  {organization.roles.map((role, index) => (
                    <div key={role.id} className="flex flex-col items-center">
                      {index > 0 && (
                        <div className="w-0.5 h-4 bg-border" />
                      )}
                      <div className="px-6 py-3 bg-background border rounded-lg shadow-sm text-center min-w-[200px]">
                        <div className="font-semibold text-sm">{role.title || "Uten tittel"}</div>
                        {role.personName && (
                          <div className="text-xs text-muted-foreground mt-1">{role.personName}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Role editing cards */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">{t("auto.rediger_roller")}</h3>
              {organization.roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="relative">
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveRole(role.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveRole(role.id, 'down')}
                        disabled={index === organization.roles.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3 pr-24">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                          <Select
                            value={PREDEFINED_ROLES.some(p => p.title === role.title) ? role.title : "custom"}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                handleUpdateRole(role.id, "title", "");
                              } else {
                                handleSelectPredefinedRole(role.id, value);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("auto.velg_rolletype")} />
                            </SelectTrigger>
                            <SelectContent>
                              {PREDEFINED_ROLES.map((predefined) => (
                                <SelectItem key={predefined.title} value={predefined.title}>
                                  {predefined.title}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">{t("auto.egendefinert_tittel")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <UserSelect
                            value={role.personName}
                            onValueChange={(value) => handleUpdateRole(role.id, "personName", value)}
                            placeholder={t("auto.velg_ansatt")}
                          />
                        </div>
                      </div>
                      {/* Custom title input if custom is selected */}
                      {!PREDEFINED_ROLES.some(p => p.title === role.title) && (
                        <div className="mt-3 pl-11">
                          <Input
                            value={role.title}
                            onChange={(e) => handleUpdateRole(role.id, "title", e.target.value)}
                            placeholder={t("auto.skriv_inn_egendefinert_rolletittel")}
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={role.description}
                        onChange={(e) => handleUpdateRole(role.id, "description", e.target.value)}
                        placeholder={t("auto.beskriv_ansvarsomraader_og_oppgaver_for_")}
                        rows={3}
                        className="resize-none"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Visual hierarchy hint */}
        {organization.roles.length > 1 && (
          <div className="flex justify-center">
            <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-2" />
              Rollene vises i hierarkisk rekkefølge fra øverst til nederst.
              <br />
              Bruk pilene for å endre rekkefølgen.
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default IkMatOrganisasjon;
