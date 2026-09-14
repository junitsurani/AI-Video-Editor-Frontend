import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Verify your email — Frame" };
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Opening your creative space…</p>}>
      <AuthForm mode="verify-email" />
    </Suspense>
  );
}
