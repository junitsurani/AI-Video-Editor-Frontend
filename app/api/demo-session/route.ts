import { NextRequest, NextResponse } from "next/server";
import { demoCookie, demoMode, demoUser } from "@/lib/demo";

export async function POST(request: NextRequest) {
  if (!demoMode)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  // JSON-only requests keep this UI-only session separate from Flask auth.
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ error: "Expected JSON" }, { status: 415 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (body.action !== "/login" && body.action !== "/logout")
    return NextResponse.json(
      { error: "Use the test login while demo mode is active." },
      { status: 400 },
    );
  if (
    body.action === "/login" &&
    (typeof body.email !== "string" ||
      body.email.trim().toLowerCase() !== demoUser.email ||
      body.password !== "Frame-Demo-2026!Silver")
  )
    return NextResponse.json(
      { error: "The test email or password is incorrect." },
      { status: 401 },
    );

  const response = NextResponse.json({
    user: body.action === "/login" ? demoUser : null,
  });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(demoCookie, body.action === "/login" ? "active" : "", {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    ...(body.action === "/logout"
      ? { maxAge: 0 }
      : { maxAge: body.remember === true ? 604800 : 28800 }),
  });
  return response;
}
