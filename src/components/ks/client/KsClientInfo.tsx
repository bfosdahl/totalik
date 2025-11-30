import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KsProjectClient } from "@/hooks/useKsProjectClient";
import { Building2, Save } from "lucide-react";

interface KsClientInfoProps {
  clientInfo: KsProjectClient | null;
  onSave: (data: Partial<KsProjectClient>) => void;
}

export function KsClientInfo({ clientInfo, onSave }: KsClientInfoProps) {
  const [formData, setFormData] = useState({
    client_name: clientInfo?.client_name || "",
    client_type: clientInfo?.client_type || "privatperson",
    address: clientInfo?.address || "",
    postal_code: clientInfo?.postal_code || "",
    city: clientInfo?.city || "",
    phone: clientInfo?.phone || "",
    email: clientInfo?.email || "",
    project_manager: clientInfo?.project_manager || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Grunnleggende informasjon
        </CardTitle>
        <CardDescription>
          Grunnleggende informasjon om byggherre/kunde for dette prosjektet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Navn *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Navn på byggherre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_type">Type *</Label>
              <Select
                value={formData.client_type}
                onValueChange={(value) => setFormData({ ...formData, client_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privatperson">Privatperson</SelectItem>
                  <SelectItem value="organisasjon">Organisasjon</SelectItem>
                  <SelectItem value="representant">Representant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Telefonnummer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="E-postadresse"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Gateadresse"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postnummer</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Postnummer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Poststed</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Poststed"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project_manager">Prosjektleder på BH-side</Label>
              <Input
                id="project_manager"
                value={formData.project_manager}
                onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
                placeholder="Navn på prosjektleder hvis aktuelt"
              />
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Lagre informasjon
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
