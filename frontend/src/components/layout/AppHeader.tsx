"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white">R</span>
          <span className="hidden sm:inline">Research Buddy</span>
        </Link>
        <div className="min-w-0 flex-1">{children}</div>
        {user && <span className="hidden text-sm text-muted-foreground md:inline">{user.name || user.email}</span>}
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut /> Log out
        </Button>
      </div>
    </header>
  );
}
