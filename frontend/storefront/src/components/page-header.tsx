import { Button } from "./ui/button";

export function PageHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      {action && onAction ? (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}
