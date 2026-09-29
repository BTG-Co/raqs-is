import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { getSession } from "@/lib/session";

export default async function NotFound() {
  const session = await getSession();
  const home = session?.user.role === "STAFF" ? "/products" : "/dashboard";
  const body = (
    <section className="rounded-card bg-card p-6 shadow-card">
      <h1 className="text-xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-muted">That address is not part of the inventory app.</p>
      <Link href={home} className="mt-4 inline-block text-sm font-semibold text-primary">
        {session?.user.role === "STAFF" ? "Back to products" : "Back to dashboard"}
      </Link>
    </section>
  );
  if (!session) return <main className="min-h-screen bg-canvas p-6">{body}</main>;
  return <AppShell user={session.user}>{body}</AppShell>;
}
