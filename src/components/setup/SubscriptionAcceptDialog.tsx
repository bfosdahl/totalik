import { UniversalOrderDialog } from "@/components/modules/UniversalOrderDialog";
import { MODULE_CONFIGS } from "@/hooks/useUniversalOrder";

interface SubscriptionAcceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export function SubscriptionAcceptDialog({
  open,
  onOpenChange,
  onAccept,
}: SubscriptionAcceptDialogProps) {
  const config = MODULE_CONFIGS.IK_HMS;

  return (
    <UniversalOrderDialog
      open={open}
      onOpenChange={onOpenChange}
      config={config}
      onOrderComplete={onAccept}
    />
  );
}
