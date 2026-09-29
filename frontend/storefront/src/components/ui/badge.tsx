import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-primary text-on-primary",
  secondary: "bg-secondary text-on-secondary",
  warning: "bg-warning text-on-warning",
  success: "bg-success text-on-primary",
  error: "bg-error text-on-primary",
  support: "bg-support text-on-primary",
};

export function Badge({
  tone = "primary",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
