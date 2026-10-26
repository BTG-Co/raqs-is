import { NextResponse } from "next/server";
import { ApiError, loginWithPassword } from "@raqs/shared/server";
import { SESSION_COOKIE, encodeSession, sessionCookieOptions } from "@/lib/session-codec";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ detail: "Username and password are required." }, { status: 422 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ detail: "NEXT_PUBLIC_API_URL is not set." }, { status: 500 });
  }

  try {
    const session = await loginWithPassword(baseUrl, username, password);
    const response = NextResponse.json({ user: session.user });
    response.cookies.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status || 401 });
    }
    return NextResponse.json({ detail: "Login failed." }, { status: 500 });
  }
}
