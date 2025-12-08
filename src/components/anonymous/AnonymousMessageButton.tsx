import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { SubmitAnonymousMessageDialog } from "./SubmitAnonymousMessageDialog";

interface Props {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function AnonymousMessageButton({ 
  variant = "outline", 
  size = "default",
  className = "",
  showLabel = true 
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className={className}
      >
        <ShieldCheck className="h-4 w-4" />
        {showLabel && <span className="ml-2">Send anonym melding</span>}
      </Button>
      
      <SubmitAnonymousMessageDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </>
  );
}
