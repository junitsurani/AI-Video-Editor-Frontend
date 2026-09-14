"use client";
import { useState } from "react";
import { useStudioUser } from "@/components/studio-session";
import { authRequest } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FolderOpen, ArrowUpRight } from "lucide-react";
import { FrameMark } from "@/components/frame-mark";
export function StudioShell({
  children,
  section = "Workspace",
}: {
  children: React.ReactNode;
  section?: string;
}) {
  const pathname = usePathname();
  const user = useStudioUser();
  const initials =
    user?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "F";
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      await authRequest("/logout", {});
      // A full document navigation discards account-specific Router Cache entries.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch {
      setError("Couldn’t sign out. Please retry.");
      setSigningOut(false);
    }
  }
  return (
    <div className="studio-shell">
      <aside className="rail">
        <Link href="/" className="rail-logo" aria-label="Frame home">
          <FrameMark size={32} />
        </Link>
        <nav>
          <Link
            href="/studio"
            className={
              pathname === "/studio" && section !== "Projects" ? "active" : ""
            }
            aria-label="Workspace"
            title="Workspace"
          >
            <LayoutGrid size={20} />
          </Link>
          <Link
            href="/studio?view=projects"
            className={
              section === "Projects" || pathname.startsWith("/studio/project/")
                ? "active"
                : ""
            }
            aria-label="All projects"
            title="All projects"
          >
            <FolderOpen size={20} />
          </Link>
        </nav>
        <Link
          className="rail-back"
          href="/"
          aria-label="Visit landing page"
          title="Visit landing page"
        >
          <ArrowUpRight size={21} />
        </Link>
        <span className="rail-avatar" title={user?.name}>
          {initials}
        </span>
      </aside>
      <div className="studio-body">
        <header className="studio-header">
          <Link href="/studio" className="brand">
            frame<span className="brand-period">.</span>
          </Link>
          <span className="header-divider" />
          <span className="breadcrumb">{section}</span>
          <div className="workspace-account">
            <span className="local-pill">Personal workspace</span>
            <details className="account-menu">
              <summary className="account-avatar" aria-label="Account menu">
                {initials}
              </summary>
              <div className="account-popover">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
                <button onClick={signOut} disabled={signingOut}>
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
                {error && <p role="alert">{error}</p>}
              </div>
            </details>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
