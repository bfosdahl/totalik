import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFormWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  isValid?: boolean;
  progress?: number;
  showProgress?: boolean;
}

export function MobileFormWrapper({
  children,
  title,
  subtitle,
  onBack,
  onSubmit,
  submitLabel = "Lagre",
  isSubmitting = false,
  isValid = true,
  progress,
  showProgress = false,
}: MobileFormWrapperProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // On desktop, just render children with minimal wrapper
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3">
          {onBack && (
            <button
              onClick={onBack}
              className="touch-target flex items-center justify-center -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && progress !== undefined && (
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-4">
          {children}
        </div>
      </main>

      {/* Sticky bottom action bar */}
      {onSubmit && (
        <div className="mobile-action-bar">
          <Button
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
