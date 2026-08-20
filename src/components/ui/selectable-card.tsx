import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SelectableCardProps {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * SelectableCard - A reusable component that correctly handles click propagation
 * between a clickable card container and its checkbox.
 *
 * This prevents the common "double-toggle" bug where both the container onClick
 * and the checkbox onCheckedChange fire, causing the selection to flip twice.
 *
 * IMPORTANT: a click on the card body does NOT call onSelectedChange directly.
 * Updating parent state straight from a plain <div> click inside a Radix Dialog
 * triggers an infinite render loop ("Maximum update depth exceeded") in Radix'
 * Presence/ref-composition, which crashed the "Opprett ny bedrift"-dialog when
 * selecting more than one module. Instead we forward the click to the real
 * checkbox element, which is the code path Radix handles safely.
 */
export function SelectableCard({
  selected,
  onSelectedChange,
  children,
  className,
  disabled = false,
}: SelectableCardProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only forward if clicking the container, not the checkbox itself
    if ((e.target as HTMLElement).closest("[data-selectable-card-checkbox]")) {
      return;
    }
    if (disabled) return;
    const checkbox = containerRef.current?.querySelector<HTMLElement>(
      "[data-selectable-card-checkbox]"
    );
    checkbox?.click();
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-secondary/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleContainerClick}
    >
      <Checkbox
        data-selectable-card-checkbox
        checked={selected}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={(checked) => {
          if (!disabled) {
            onSelectedChange(checked === true);
          }
        }}
      />
      {children}
    </div>
  );
}
