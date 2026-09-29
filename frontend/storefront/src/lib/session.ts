import { cookies } from "next/headers";
import type { Session } from "@raqs/shared";
import { SESSION_COOKIE, decodeSession } from "./session-codec";

export { SESSION_COOKIE, encodeSession, decodeSession, sessionCookieOptions } from "./session-codec";

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}
