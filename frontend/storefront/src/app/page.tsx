import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, decodeSession } from "@/lib/session-codec";

export default async function HomePage() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  const session = raw ? decodeSession(raw) : null;
  redirect(session?.user.role === "STAFF" ? "/products" : "/dashboard");
}
