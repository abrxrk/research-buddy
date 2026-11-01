"use client";

import { LogOut } from "lucide-react";

import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function AppHeader({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Logo href="/dashboard" className="[&>span:last-child]:max-sm:hidden" />
        <div className="min-w-0 flex-1">{children}</div>
        {user && (
          <div className="flex items-center gap-1 rounded-full border bg-white/[0.02] py-1 pr-1 pl-1">
            <span className="grid size-7 place-items-center rounded-full bg-highlight text-[11px] font-semibold text-zinc-900">
              {initials(user.name || user.email)}
            </span>
            <span className="hidden max-w-40 truncate px-2 text-sm md:inline">{user.name || user.email}</span>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
