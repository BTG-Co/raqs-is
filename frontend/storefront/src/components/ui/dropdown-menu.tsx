"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;

export function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof Dropdown.Content>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        align="end"
        sideOffset={8}
        className={cn("z-50 min-w-40 rounded-card bg-card p-1 shadow-card", className)}
        {...props}
      />
    </Dropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof Dropdown.Item>) {
  return (
    <Dropdown.Item
      className={cn(
        "cursor-pointer rounded-lg px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-primary-50",
        className,
      )}
      {...props}
    />
  );
}
