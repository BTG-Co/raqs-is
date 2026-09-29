import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ detail: "Not signed in." }, { status: 401 });
  return NextResponse.json({ user: session.user });
}
