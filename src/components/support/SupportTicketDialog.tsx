import { useState } from "react";
import { MessageCircleQuestion, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function SupportTicketDialog() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (subject.trim().length < 2) {
      toast.error("Skriv inn et emne");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Skriv inn en melding");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-support-ticket", {
        body: { subject, message },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Henvendelsen er sendt! Vi svarer så snart vi kan.");
      setSubject("");
      setMessage("");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Kunne ikke sende henvendelsen");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary"
        >
          <MessageCircleQuestion className="h-4 w-4" />
          <span className="hidden sm:inline">Support</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
            Kontakt support
          </DialogTitle>
          <DialogDescription>
            Send oss en melding så svarer vi så snart vi kan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="support-subject">Emne</Label>
            <Input
              id="support-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Hva gjelder henvendelsen?"
              disabled={isSending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-message">Melding</Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Beskriv problemet eller spørsmålet ditt..."
              rows={5}
              disabled={isSending}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSending}
            className="w-full"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending ? "Sender..." : "Send henvendelse"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
