import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, X, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface EmailAttachment {
  filename: string;
  content: string; // base64 (no data: prefix)
  contentType?: string;
}

interface EmailSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "deviation" | "handbook" | "daily-report";
  subject: string;
  htmlContent: string;
  users: User[];
  companyName?: string;
  attachments?: EmailAttachment[];
}

export function EmailSendDialog({
  open,
  onOpenChange,
  documentType,
  subject,
  htmlContent,
  users,
  companyName,
  attachments,
}: EmailSendDialogProps) {
  const { profile } = useAuth();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedUserIds([]);
      setCustomEmails([]);
      setNewEmail("");
    }
    onOpenChange(isOpen);
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  const handleAddCustomEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Ugyldig e-postadresse");
      return;
    }

    if (customEmails.includes(email)) {
      toast.error("E-postadressen er allerede lagt til");
      return;
    }

    setCustomEmails((prev) => [...prev, email]);
    setNewEmail("");
  };

  const handleRemoveCustomEmail = (email: string) => {
    setCustomEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleSend = async () => {
    const selectedUserEmails = users
      .filter((u) => selectedUserIds.includes(u.id))
      .map((u) => u.email)
      .filter(Boolean);

    const allRecipients = [...selectedUserEmails, ...customEmails];

    if (allRecipients.length === 0) {
      toast.error("Velg minst én mottaker");
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: {
          documentType,
          subject,
          recipients: allRecipients,
          htmlContent,
          senderName: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : undefined,
          companyName,
        },
      });

      if (error) throw error;

      toast.success(`E-post sendt til ${allRecipients.length} mottaker${allRecipients.length > 1 ? "e" : ""}`);
      handleOpenChange(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Kunne ikke sende e-post");
    } finally {
      setIsSending(false);
    }
  };

  const totalRecipients = selectedUserIds.length + customEmails.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mail className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Send {documentType === "deviation" ? "avvik" : "håndbok"} på e-post</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Registered users */}
          {users.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Registrerte brukere
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedUserIds.length === users.length ? "Fjern alle" : "Velg alle"}
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => handleToggleUser(user.id)}
                  >
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom emails */}
          <div className="space-y-2">
            <Label>Andre mottakere</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="epost@eksempel.no"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomEmail();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddCustomEmail}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {customEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Summary and send button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {totalRecipients} mottaker{totalRecipients !== 1 ? "e" : ""} valgt
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 sm:flex-none">
                Avbryt
              </Button>
              <Button onClick={handleSend} disabled={isSending || totalRecipients === 0} className="flex-1 sm:flex-none">
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
