import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Calendar, Phone, Mail, Check, Trash2, Loader2 } from "lucide-react";
import { useIkAlkoholOrganization, ROLE_TYPES } from "@/hooks/useIkAlkoholOrganization";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const IkAlkoholOrganisering = () => {
  const navigate = useNavigate();
  const { modules, isLoading: modulesLoading } = useCompanyModules();
  const { organization, shifts, isLoading, createRole, deleteRole, confirmRole, createShift, deleteShift } = useIkAlkoholOrganization();
  
  const [activeTab, setActiveTab] = useState('roles');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  
  const [roleForm, setRoleForm] = useState({ role_type: '', employee_name: '', phone: '', email: '' });
  const [shiftForm, setShiftForm] = useState({ shift_date: '', shift_time: '', styrer_name: '', stedfortreder_name: '' });

  const hasIkAlkohol = modules?.some(m => m.module_type === 'IK_ALKOHOL' && m.is_active);
  
  if (modulesLoading || isLoading) {
    return <AppLayout><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!hasIkAlkohol) {
    navigate('/');
    return null;
  }

  const handleSaveRole = async () => {
    if (!roleForm.role_type || !roleForm.employee_name) return;
    await createRole.mutateAsync(roleForm);
    setShowRoleDialog(false);
    setRoleForm({ role_type: '', employee_name: '', phone: '', email: '' });
  };

  const handleSaveShift = async () => {
    if (!shiftForm.shift_date || !shiftForm.styrer_name) return;
    await createShift.mutateAsync(shiftForm);
    setShowShiftDialog(false);
    setShiftForm({ shift_date: '', shift_time: '', styrer_name: '', stedfortreder_name: '' });
  };

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Organisering</h1>
            <p className="text-muted-foreground">Roller, ansvar og vaktplan</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="roles"><Users className="h-4 w-4 mr-2" />Roller og ansvar</TabsTrigger>
            <TabsTrigger value="shifts"><Calendar className="h-4 w-4 mr-2" />Vaktplan</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowRoleDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />Legg til rolle
              </Button>
            </div>

            {organization.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Ingen roller registrert</CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {organization.map(role => {
                  const roleInfo = ROLE_TYPES.find(r => r.value === role.role_type);
                  return (
                    <Card key={role.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{roleInfo?.label || role.role_type}</CardTitle>
                          {role.confirmed_at && <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Bekreftet</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{roleInfo?.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="font-medium">{role.employee_name}</p>
                          {role.phone && <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" />{role.phone}</p>}
                          {role.email && <p className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />{role.email}</p>}
                          
                          {roleInfo?.responsibilities && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Ansvarsområder:</p>
                              <ul className="text-xs space-y-1">
                                {roleInfo.responsibilities.map((r, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>{r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-4">
                            {!role.confirmed_at && (
                              <Button size="sm" variant="outline" onClick={() => confirmRole.mutate({ id: role.id, signature: role.employee_name })}>
                                <Check className="h-4 w-4 mr-1" />Bekreft rolle
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => deleteRole.mutate(role.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shifts">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowShiftDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />Registrer vakt
              </Button>
            </div>

            {shifts.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Ingen vakter registrert</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {shifts.map(shift => (
                  <Card key={shift.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold">{format(new Date(shift.shift_date), 'dd', { locale: nb })}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(shift.shift_date), 'MMM', { locale: nb })}</p>
                        </div>
                        <div>
                          <p className="font-medium">Styrer: {shift.styrer_name}</p>
                          {shift.stedfortreder_name && <p className="text-sm text-muted-foreground">Stedfortreder: {shift.stedfortreder_name}</p>}
                          {shift.shift_time && <p className="text-xs text-muted-foreground">{shift.shift_time}</p>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteShift.mutate(shift.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Role Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Legg til rolle</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rolletype *</label>
                <Select value={roleForm.role_type} onValueChange={(v) => setRoleForm({ ...roleForm, role_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Velg rolle" /></SelectTrigger>
                  <SelectContent>
                    {ROLE_TYPES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Navn *</label>
                <Input value={roleForm.employee_name} onChange={(e) => setRoleForm({ ...roleForm, employee_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input value={roleForm.phone} onChange={(e) => setRoleForm({ ...roleForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">E-post</label>
                <Input value={roleForm.email} onChange={(e) => setRoleForm({ ...roleForm, email: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Avbryt</Button>
              <Button onClick={handleSaveRole}>Lagre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shift Dialog */}
        <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrer vakt</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Dato *</label>
                <Input type="date" value={shiftForm.shift_date} onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Tid</label>
                <Input placeholder="f.eks. 18:00-03:00" value={shiftForm.shift_time} onChange={(e) => setShiftForm({ ...shiftForm, shift_time: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Styrer *</label>
                <Input value={shiftForm.styrer_name} onChange={(e) => setShiftForm({ ...shiftForm, styrer_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Stedfortreder</label>
                <Input value={shiftForm.stedfortreder_name} onChange={(e) => setShiftForm({ ...shiftForm, stedfortreder_name: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShiftDialog(false)}>Avbryt</Button>
              <Button onClick={handleSaveShift}>Lagre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default IkAlkoholOrganisering;
