import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Actions or hints shown under the description. */
  children?: React.ReactNode;
  className?: string;
};

/** Centred empty / error / "nothing matches" state. Keep copy short; put the next step in `children`. */
export function EmptyState({ icon: Icon, title, description, children, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-3 grid size-9 place-items-center rounded-md border bg-muted/40 text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">{description}</p>}
      {children && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
