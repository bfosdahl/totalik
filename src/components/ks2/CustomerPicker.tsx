import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface PickedCustomer {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  org_number: string | null;
}

interface CustomerPickerProps {
  value?: string | null;
  currentName?: string;
  onSelect: (customer: PickedCustomer | null) => void;
}

export function CustomerPicker({ value, currentName, onSelect }: CustomerPickerProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["ks2-customers-picker", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("company_customers")
        .select("id, name, contact_person, phone, email, address, org_number")
        .eq("company_id", profile.company_id)
        .eq("is_deleted", false)
        .order("name");
      if (error) throw error;
      return (data || []) as PickedCustomer[];
    },
    enabled: !!profile?.company_id,
  });

  const selected = useMemo(() => customers.find((c) => c.id === value) || null, [customers, value]);

  const canCreate =
    search.trim().length > 1 &&
    !customers.some((c) => c.name.trim().toLowerCase() === search.trim().toLowerCase());

  const handleCreate = async () => {
    if (!profile?.company_id) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("company_customers")
        .insert({
          company_id: profile.company_id,
          name: search.trim(),
          created_by: profile.id,
        })
        .select("id, name, contact_person, phone, email, address, org_number")
        .single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["ks2-customers-picker"] });
      queryClient.invalidateQueries({ queryKey: ["ks2-customers"] });
      onSelect(data as PickedCustomer);
      setOpen(false);
      setSearch("");
      toast.success("Kunde lagt til i kunderegisteret");
    } catch (e) {
      console.error(e);
      toast.error("Kunne ikke opprette kunden");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected?.name || currentName || "Velg kunde fra kunderegisteret"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder="Søk etter kunde..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Laster..." : "Ingen kunder funnet"}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.org_number || ""}`}
                  onSelect={() => {
                    onSelect(c);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{c.name}</span>
                  {c.org_number && (
                    <span className="ml-auto text-xs text-muted-foreground">{c.org_number}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {canCreate && (
              <CommandGroup>
                <CommandItem value={`__create__${search}`} onSelect={handleCreate} disabled={creating}>
                  {creating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Opprett kunde «{search.trim()}»
                </CommandItem>
              </CommandGroup>
            )}
            {(value || currentName) && (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                >
                  Fjern kobling til kunde
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
