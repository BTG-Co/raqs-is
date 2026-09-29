"use client";

import { useState } from "react";
import type { SessionUser } from "@raqs/shared";
import { Sheet } from "../ui/sheet";
import { SearchProvider } from "./search-context";
import { SessionProvider } from "./session-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SessionProvider user={user}>
      <SearchProvider>
        <div className="flex min-h-screen bg-canvas">
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block">
            <Sidebar user={user} />
          </aside>
          <Sheet open={open} onOpenChange={setOpen} label="Navigation">
            <Sidebar user={user} onNavigate={() => setOpen(false)} />
          </Sheet>
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar user={user} onMenu={() => setOpen(true)} />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </SearchProvider>
    </SessionProvider>
  );
}
