import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Send, Loader2 } from "lucide-react";
import { useAnonymousMessages } from "@/hooks/useAnonymousMessages";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: "arbeidsmiljo", label: "Arbeidsmiljø" },
  { value: "sikkerhet", label: "Sikkerhet" },
  { value: "trakassering", label: "Trakassering" },
  { value: "diskriminering", label: "Diskriminering" },
  { value: "regelbrudd", label: "Regelbrudd" },
  { value: "annet", label: "Annet" },
];

export function SubmitAnonymousMessageDialog({ open, onOpenChange }: Props) {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { submitMessage } = useAnonymousMessages();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !subject || !message.trim()) return;

    await submitMessage.mutateAsync({ category, subject, message });
    
    // Reset form
    setCategory("");
    setSubject("");
    setMessage("");
    onOpenChange(false);
  };

  const isValid = category && subject && message.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Send anonym melding
          </DialogTitle>
          <DialogDescription>
            Din identitet er fullstendig skjult. Meldingen sendes til leder og verneombud.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-4">
            <Alert className="border-primary/30 bg-primary/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>100% anonymt:</strong> Vi lagrer ingen informasjon som kan identifisere deg. 
                Hverken navn, IP-adresse eller tidspunkt for innsending kan spores tilbake til deg.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Emne *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Kort beskrivelse av saken"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Melding *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Beskriv saken så detaljert du ønsker..."
                  rows={4}
                  className="resize-none min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 tegn. Gjeldende: {message.length} tegn
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-1">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={!isValid || submitMessage.isPending}>
                  {submitMessage.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sender...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send anonymt
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
