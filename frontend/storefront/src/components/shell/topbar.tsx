"use client";

import { Menu } from "lucide-react";
import type { SessionUser } from "@raqs/shared";
import { initials } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

export function Topbar({ user, onMenu }: { user: SessionUser; onMenu: () => void }) {

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <header className="flex h-14 items-center gap-3 bg-navbar px-4 text-on-primary">
      <button
        type="button"
        className="rounded-lg p-2 lg:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger className="ml-auto flex items-center gap-2 rounded-pill px-2 py-1 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold">
            {initials(user.name || user.username)}
          </span>
          <span className="hidden sm:inline">{user.name || user.username}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => void signOut()}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
