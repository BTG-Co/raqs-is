"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

export function Sheet({
  open,
  onOpenChange,
  children,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-ink/40 lg:hidden" />
        <DialogPrimitive.Content
          aria-label={label}
          className="fixed inset-y-0 left-0 z-50 w-60 bg-sidebar shadow-card outline-none lg:hidden"
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
