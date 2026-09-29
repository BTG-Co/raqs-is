"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const mock = process.env.NEXT_PUBLIC_AUTH_MODE === "mock";

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <form
        className="w-full max-w-md space-y-4 rounded-card bg-card p-6 shadow-card"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const body = (await response.json()) as { detail?: string; user?: { role?: string } };
          setPending(false);
          if (!response.ok) {
            setError(typeof body.detail === "string" ? body.detail : "Login failed.");
            return;
          }
          router.replace(body.user?.role === "STAFF" ? "/products" : "/dashboard");
          router.refresh();
        }}
      >
        <div>
          <h1 className="text-xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-muted">RAQS inventory</p>
        </div>
        {mock ? (
          <p className="rounded-lg bg-warning px-3 py-2 text-sm text-on-warning" role="status">
            Dev login. Password is not checked.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
