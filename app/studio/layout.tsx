import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import StudioError from "./error";
import { StudioSession } from "@/components/studio-session";
import { safeNext, type User } from "@/lib/auth";
import { demoCookie, demoMode, demoUser } from "@/lib/demo";
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jar, header] = await Promise.all([cookies(), headers()]);
  const next = safeNext(header.get("x-frame-path"));
  if (demoMode) {
    if (jar.get(demoCookie)?.value !== "active")
      redirect("/login?next=" + encodeURIComponent(next));
    return <StudioSession user={demoUser}>{children}</StudioSession>;
  }
  const cookie = jar.get("__Host-frame_session") || jar.get("frame_session");
  if (!cookie) redirect("/login?next=" + encodeURIComponent(next));
  const response = await fetch(
    `${process.env.API_INTERNAL_URL || "http://127.0.0.1:5001"}/api/auth/me`,
    {
      headers: { Cookie: `${cookie.name}=${cookie.value}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  ).catch(() => null);
  if (!response) return <StudioError />;
  if (response.status === 401)
    redirect("/login?next=" + encodeURIComponent(next));
  if (!response.ok) return <StudioError />;
  const { user }: { user: User } = await response.json();
  return <StudioSession user={user}>{children}</StudioSession>;
}
