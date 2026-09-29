import type { Session, SessionUser } from "@raqs/shared";

export const SESSION_COOKIE = "raqs_session";

export function encodeSession(session: Session): string {
  const bytes = new TextEncoder().encode(JSON.stringify(session));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSession(value: string): Session | null {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<Session>;
    const user = parsed.user;
    if (!user || !isUser(user)) return null;
    return { user, accessToken: parsed.accessToken ?? null };
  } catch {
    return null;
  }
}

function isUser(value: SessionUser): boolean {
  return (
    typeof value.id === "string" &&
    typeof value.username === "string" &&
    typeof value.name === "string" &&
    (value.role === "ADMIN" || value.role === "STAFF")
  );
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
