import { cn } from "@/lib/utils";

/** Loading placeholder. Size it with className to match the final layout: <Skeleton className="h-4 w-48" />. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted/70", className)} {...props} />;
}
