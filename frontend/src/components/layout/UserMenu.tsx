"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronsUpDown, Copy, Keyboard, Library, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

type Props = {
  user: User;
  onSearch: () => void;
  onShortcuts: () => void;
  onLogout: () => void;
  /** Avatar only (mobile top bar). */
  compact?: boolean;
};

const itemCls =
  "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/90 outline-none data-highlighted:bg-muted data-highlighted:text-foreground";

export function Avatar({ user, className }: { user: User; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground", className)}>
      {(user.name || user.email)[0]?.toUpperCase()}
    </span>
  );
}

/** Account menu at the bottom of the sidebar: who's signed in, quick actions, log out. */
export function UserMenu({ user, onSearch, onShortcuts, onLogout, compact }: Props) {
  const name = user.name || user.email;
  // Let the menu close and hand focus back before a dialog opens, so the dialog keeps focus.
  const later = (fn: () => void) => () => setTimeout(fn, 0);
  const copyEmail = () =>
    navigator.clipboard
      .writeText(user.email)
      .then(() => toast.success("Email copied"))
      .catch(() => toast.error("Couldn't copy to the clipboard"));
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={compact ? `Account: ${name}` : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md text-left outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted",
          compact ? "grid size-10 place-items-center" : "w-full px-2 py-1.5",
        )}
      >
        <Avatar user={user} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{name}</span>
              {user.name && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side={compact ? "bottom" : "top"} align={compact ? "end" : "start"} sideOffset={6} className="z-50 outline-none">
          <Menu.Popup className="popup-anim w-60 rounded-md border bg-popover p-1 shadow-lg shadow-black/40 outline-none">
            {compact && (
              <>
                <div className="px-2 py-1.5">
                  <span className="block truncate text-sm font-medium">{name}</span>
                  {user.name && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
                </div>
                <Menu.Separator className="my-1 h-px bg-border" />
              </>
            )}
            <Menu.LinkItem render={<Link href="/dashboard" />} className={itemCls}>
              <Library className="size-3.5 text-muted-foreground" /> Library
            </Menu.LinkItem>
            <Menu.Item onClick={later(onSearch)} className={itemCls}>
              <Search className="size-3.5 text-muted-foreground" /> Search
              <Kbd combo="mod+k" className="ml-auto" />
            </Menu.Item>
            <Menu.Item onClick={later(onShortcuts)} className={itemCls}>
              <Keyboard className="size-3.5 text-muted-foreground" /> Keyboard shortcuts
              <Kbd className="ml-auto">?</Kbd>
            </Menu.Item>
            <Menu.Item onClick={copyEmail} className={itemCls}>
              <Copy className="size-3.5 text-muted-foreground" /> Copy email
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item onClick={onLogout} className={itemCls}>
              <LogOut className="size-3.5 text-muted-foreground" /> Log out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
