"use client";
import Link from "next/link";
export default function StudioError({ reset }: { reset?: () => void }) {
  return (
    <main className="account-error">
      <h1>We couldn’t open your studio.</h1>
      <p>Check your connection and try again.</p>
      <button onClick={reset || (() => window.location.reload())}>
        Try again
      </button>
      <Link href="/login">Back to sign in</Link>
    </main>
  );
}
