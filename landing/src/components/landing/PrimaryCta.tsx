"use client";

import { ArrowRight, Play } from "lucide-react";

import { APP_URL, DEMO_URL } from "@/components/landing/constants";
import { useIsDeployed } from "@/hooks/useIsDeployed";
import { cn } from "@/lib/utils";

/**
 * Main call-to-action. Locally it opens the app's sign-in page;
 * on a deployed domain it becomes "Watch demo" and opens the demo video on GitHub.
 */
export function PrimaryCta({ label = "Get started", className }: { label?: string; className?: string }) {
  const deployed = useIsDeployed();
  const base = cn("group flex w-fit items-center gap-2 rounded-full bg-foreground font-medium text-background transition-transform hover:scale-[1.03]", className);

  if (deployed)
    return (
      <a href={DEMO_URL} target="_blank" rel="noreferrer" className={base}>
        <Play className="size-3.5 fill-current" /> Watch demo
      </a>
    );

  return (
    // invisible until we know the host, so deployed visitors never see the wrong button flash
    <a href={`${APP_URL}/auth`} className={cn(base, deployed === null && "invisible")}>
      {label}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
