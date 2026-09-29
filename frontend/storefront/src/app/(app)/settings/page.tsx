"use client";

import { useSessionUser } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const user = useSessionUser();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-ink">Settings</h1>
      <section className="max-w-lg space-y-4 rounded-card bg-card p-6 shadow-card">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Name</p>
          <p className="text-ink">{user.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Username</p>
          <p className="text-ink">{user.username}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Role</p>
          <Badge tone={user.role === "ADMIN" ? "primary" : "secondary"}>{user.role}</Badge>
        </div>
        <p className="text-sm text-muted">Profile edits need a future auth endpoint. This page is read-only.</p>
        <Button type="button" variant="ghost" onClick={() => void signOut()}>
          Log out
        </Button>
      </section>
    </div>
  );
}
