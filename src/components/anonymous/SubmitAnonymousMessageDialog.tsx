import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Send, Loader2 } from "lucide-react";
import { useAnonymousMessages } from "@/hooks/useAnonymousMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { t } from "@/i18n/t";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: "arbeidsmiljo", label: t("auto.arbeidsmiljoe") },
  { value: "sikkerhet", label: t("auto.sikkerhet") },
  { value: "trakassering", label: t("auto.trakassering") },
  { value: "diskriminering", label: t("auto.diskriminering") },
  { value: "regelbrudd", label: t("auto.regelbrudd") },
  { value: "annet", label: t("auto.annet") },
];

export function SubmitAnonymousMessageDialog({ open, onOpenChange }: Props) {
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { submitMessage } = useAnonymousMessages();
  const isMobile = useIsMobile();

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

  const formContent = (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>{t("auto.100_anonymt")}</strong> {t("auto.vi_lagrer_ingen_informasjon_som_kan_iden")}
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">{t("auto.kategori_2")}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder={t("auto.velg_kategori")} />
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
          <Label htmlFor="subject">{t("auto.emne")}</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("auto.kort_beskrivelse_av_saken")}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">{t("auto.melding_2")}</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("auto.beskriv_saken_saa_detaljert_du_oensker")}
            rows={4}
            className="resize-none min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            Minimum 10 tegn. Gjeldende: {message.length} tegn
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.avbryt")}
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
                {t("auto.send_anonymt")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <div className="overflow-y-auto px-4 pb-8">
            <DrawerHeader className="text-left px-0">
              <DrawerTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t("auto.send_anonym_melding")}
              </DrawerTitle>
              <DrawerDescription>
                {t("auto.din_identitet_er_fullstendig_skjult_meld")}
              </DrawerDescription>
            </DrawerHeader>
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("auto.send_anonym_melding")}
          </DialogTitle>
          <DialogDescription>
            {t("auto.din_identitet_er_fullstendig_skjult_meld")}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
