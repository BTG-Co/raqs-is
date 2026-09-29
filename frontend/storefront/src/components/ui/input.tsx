import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}
