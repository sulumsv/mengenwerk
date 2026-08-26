import { NextRequest, NextResponse } from "next/server";

async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  const { passwort, next } = await req.json();
  const richtig = process.env.MENGENWERK_PASSWORD;

  if (!richtig || passwort !== richtig) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, next: typeof next === "string" ? next : "/" });
  res.cookies.set("mw_auth", await hash(richtig), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
