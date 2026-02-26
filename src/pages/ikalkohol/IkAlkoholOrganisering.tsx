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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Users, Calendar, Phone, Mail, Check, Trash2, Loader2, ChevronsUpDown, UserPlus, Pencil, GraduationCap, PenTool } from "lucide-react";
import { useIkAlkoholOrganization, ROLE_TYPES } from "@/hooks/useIkAlkoholOrganization";
import { useIkAlkoholTraining } from "@/hooks/useIkAlkoholTraining";
import { useCompanyModules } from "@/hooks/useCompanyModules";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const IkAlkoholOrganisering = () => {
  const navigate = useNavigate();
  const { modules, isLoading: modulesLoading } = useCompanyModules();
  const { users: companyUsers, isLoading: usersLoading, getUserDisplayName } = useCompanyUsers();
  const { organization, shifts, isLoading, createRole, updateRole, deleteRole, confirmRole, createShift, deleteShift } = useIkAlkoholOrganization();
  const { trainingRecords, isLoading: trainingLoading, createRecord, signRecord, deleteRecord } = useIkAlkoholTraining();
  
  const [activeTab, setActiveTab] = useState('roles');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
  const [styrerPopoverOpen, setStyrerPopoverOpen] = useState(false);
  const [stedfortrederPopoverOpen, setStedfortrederPopoverOpen] = useState(false);
  const [customNameMode, setCustomNameMode] = useState(false);
  const [styrerCustomMode, setStyrerCustomMode] = useState(false);
  const [stedfortrederCustomMode, setStedfortrederCustomMode] = useState(false);
  
  const [roleForm, setRoleForm] = useState({ role_type: '', employee_name: '', employee_id: '', phone: '', email: '' });
  const [shiftForm, setShiftForm] = useState({ shift_date: '', shift_time: '', styrer_name: '', stedfortreder_name: '' });

  const hasIkAlkohol = modules?.some(m => m.module_type === 'IK_ALKOHOL' && m.is_active);
  
  if (modulesLoading || isLoading || usersLoading || trainingLoading) {
    return <AppLayout><div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!hasIkAlkohol) {
    navigate('/');
    return null;
  }

  const handleSaveRole = async () => {
    if (!roleForm.role_type || !roleForm.employee_name) return;
    const { employee_id, ...rest } = roleForm;
    if (editingRoleId) {
      await updateRole.mutateAsync({ id: editingRoleId, ...rest, user_id: employee_id || undefined } as any);
    } else {
      await createRole.mutateAsync({ ...rest, user_id: employee_id || undefined } as any);
    }
    setShowRoleDialog(false);
    setEditingRoleId(null);
    setRoleForm({ role_type: '', employee_name: '', employee_id: '', phone: '', email: '' });
    setCustomNameMode(false);
  };

  const handleEditRole = (role: typeof organization[0]) => {
    setRoleForm({
      role_type: role.role_type,
      employee_name: role.employee_name,
      employee_id: role.user_id || '',
      phone: role.phone || '',
      email: role.email || '',
    });
    setEditingRoleId(role.id);
    setCustomNameMode(!role.user_id);
    setShowRoleDialog(true);
  };

  const selectEmployee = (user: typeof companyUsers[0]) => {
    setRoleForm({
      ...roleForm,
      employee_name: getUserDisplayName(user),
      employee_id: user.id,
      email: user.email || '',
      phone: roleForm.phone
    });
    setEmployeePopoverOpen(false);
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
            <TabsTrigger value="training"><GraduationCap className="h-4 w-4 mr-2" />Opplæring</TabsTrigger>
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
                            <Button size="sm" variant="outline" onClick={() => handleEditRole(role)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
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

          {/* Training Tab */}
          <TabsContent value="training">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Opplæringsbekreftelse</h2>
                  <p className="text-sm text-muted-foreground">Alle ansatte skal signere at de har mottatt opplæring i alkohollovgivning og internkontroll</p>
                </div>
                <Button onClick={() => {
                  // Add all company users that don't already have a record
                  const existingUserIds = trainingRecords.map(r => r.employee_user_id).filter(Boolean);
                  const newUsers = companyUsers.filter(u => !existingUserIds.includes(u.user_id));
                  if (newUsers.length === 0) {
                    toast.info("Alle ansatte er allerede lagt til");
                    return;
                  }
                  newUsers.forEach(user => {
                    createRecord.mutate({
                      employee_user_id: user.user_id,
                      employee_name: getUserDisplayName(user),
                    });
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />Legg til alle ansatte
                </Button>
              </div>

              {trainingRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Ingen opplæringsregistreringer. Klikk "Legg til alle ansatte" for å opprette.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {trainingRecords.map(record => (
                    <Card key={record.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              record.signed_at ? "bg-green-100" : "bg-amber-100"
                            )}>
                              {record.signed_at ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <PenTool className="h-5 w-5 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{record.employee_name}</p>
                              <p className="text-sm text-muted-foreground">{record.training_topic}</p>
                              {record.signed_at && (
                                <p className="text-xs text-green-600">
                                  Signert digitalt {format(new Date(record.signed_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!record.signed_at && (
                              <Button
                                size="sm"
                                onClick={() => signRecord.mutate({ id: record.id })}
                              >
                                <PenTool className="h-4 w-4 mr-1" />Signer
                              </Button>
                            )}
                            {record.signed_at && (
                              <Badge className="bg-green-100 text-green-800">Signert</Badge>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => deleteRecord.mutate(record.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Card className="bg-muted/50">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Status: {trainingRecords.filter(r => r.signed_at).length} av {trainingRecords.length} har signert
                        </span>
                        <Badge variant={trainingRecords.every(r => r.signed_at) ? "default" : "secondary"}>
                          {trainingRecords.every(r => r.signed_at) ? "Komplett" : "Ufullstendig"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Role Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={(open) => { setShowRoleDialog(open); if (!open) { setEditingRoleId(null); setRoleForm({ role_type: '', employee_name: '', employee_id: '', phone: '', email: '' }); setCustomNameMode(false); } }} modal={false}>
          <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader><DialogTitle>{editingRoleId ? 'Rediger rolle' : 'Legg til rolle'}</DialogTitle></DialogHeader>
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
                <label className="text-sm font-medium">Ansatt *</label>
                {customNameMode ? (
                  <div className="flex gap-2">
                    <Input 
                      value={roleForm.employee_name} 
                      onChange={(e) => setRoleForm({ ...roleForm, employee_name: e.target.value, employee_id: '' })}
                      placeholder="Skriv navn..."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => setCustomNameMode(false)}>
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {roleForm.employee_name || "Velg ansatt..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover z-[9999]" align="start">
                      <Command>
                        <CommandInput placeholder="Søk etter ansatt..." />
                        <CommandList>
                          <CommandEmpty>Ingen ansatte funnet</CommandEmpty>
                          <CommandGroup heading="Ansatte">
                            {companyUsers.map((user) => (
                              <CommandItem key={user.id} onSelect={() => selectEmployee(user)}>
                                <Check className={cn("mr-2 h-4 w-4", roleForm.employee_id === user.id ? "opacity-100" : "opacity-0")} />
                                {getUserDisplayName(user)}
                                {user.email && <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup>
                            <CommandItem onSelect={() => { setCustomNameMode(true); setEmployeePopoverOpen(false); }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Skriv inn manuelt...
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
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
                {styrerCustomMode ? (
                  <div className="flex gap-2">
                    <Input 
                      value={shiftForm.styrer_name} 
                      onChange={(e) => setShiftForm({ ...shiftForm, styrer_name: e.target.value })}
                      placeholder="Skriv navn..."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => setStyrerCustomMode(false)}>
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Popover open={styrerPopoverOpen} onOpenChange={setStyrerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {shiftForm.styrer_name || "Velg styrer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover" align="start">
                      <Command>
                        <CommandInput placeholder="Søk etter ansatt..." />
                        <CommandList>
                          <CommandEmpty>Ingen ansatte funnet</CommandEmpty>
                          <CommandGroup heading="Ansatte">
                            {companyUsers.map((user) => (
                              <CommandItem key={user.id} onSelect={() => { setShiftForm({ ...shiftForm, styrer_name: getUserDisplayName(user) }); setStyrerPopoverOpen(false); }}>
                                {getUserDisplayName(user)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup>
                            <CommandItem onSelect={() => { setStyrerCustomMode(true); setStyrerPopoverOpen(false); }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Skriv inn manuelt...
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Stedfortreder</label>
                {stedfortrederCustomMode ? (
                  <div className="flex gap-2">
                    <Input 
                      value={shiftForm.stedfortreder_name} 
                      onChange={(e) => setShiftForm({ ...shiftForm, stedfortreder_name: e.target.value })}
                      placeholder="Skriv navn..."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => setStedfortrederCustomMode(false)}>
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Popover open={stedfortrederPopoverOpen} onOpenChange={setStedfortrederPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {shiftForm.stedfortreder_name || "Velg stedfortreder..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-popover" align="start">
                      <Command>
                        <CommandInput placeholder="Søk etter ansatt..." />
                        <CommandList>
                          <CommandEmpty>Ingen ansatte funnet</CommandEmpty>
                          <CommandGroup heading="Ansatte">
                            {companyUsers.map((user) => (
                              <CommandItem key={user.id} onSelect={() => { setShiftForm({ ...shiftForm, stedfortreder_name: getUserDisplayName(user) }); setStedfortrederPopoverOpen(false); }}>
                                {getUserDisplayName(user)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandGroup>
                            <CommandItem onSelect={() => { setStedfortrederCustomMode(true); setStedfortrederPopoverOpen(false); }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Skriv inn manuelt...
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
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
