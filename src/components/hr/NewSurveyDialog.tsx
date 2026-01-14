import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { nb } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NewSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewSurveyDialog({ open, onOpenChange, onSuccess }: NewSurveyDialogProps) {
  const { company } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [surveyType, setSurveyType] = useState("pulse");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14));

  const handleSubmit = async () => {
    if (!company?.id || !title.trim()) {
      toast.error("Vennligst fyll ut tittel");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("employee_surveys").insert({
        company_id: company.id,
        survey_title: title.trim(),
        survey_description: description.trim() || null,
        survey_type: surveyType,
        is_anonymous: isAnonymous,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: "draft",
        questions: [],
      });

      if (error) throw error;

      toast.success("Undersøkelse opprettet!");
      onOpenChange(false);
      onSuccess();
      // Reset form
      setTitle("");
      setDescription("");
      setSurveyType("pulse");
      setIsAnonymous(true);
      setStartDate(new Date());
      setEndDate(addDays(new Date(), 14));
    } catch (error) {
      console.error("Error creating survey:", error);
      toast.error("Kunne ikke opprette undersøkelse");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ny medarbeiderundersøkelse</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Pulsmåling Q1 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av undersøkelsen..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Type undersøkelse</Label>
            <Select value={surveyType} onValueChange={setSurveyType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pulse">Pulsmåling</SelectItem>
                <SelectItem value="engagement">Engasjementsundersøkelse</SelectItem>
                <SelectItem value="satisfaction">Medarbeidertilfredshet</SelectItem>
                <SelectItem value="custom">Egendefinert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "d. MMM yyyy", { locale: nb })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Sluttdato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "d. MMM yyyy", { locale: nb })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={nb}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Anonym undersøkelse</Label>
              <p className="text-sm text-muted-foreground">
                Svar kan ikke spores tilbake til enkeltpersoner
              </p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "Oppretter..." : "Opprett undersøkelse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
