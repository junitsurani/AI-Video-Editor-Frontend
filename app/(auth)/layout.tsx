import Link from "next/link";
import Image from "next/image";
import { FrameMark } from "@/components/frame-mark";
import s from "./auth.module.css";
export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className={s.shell}>
      <div className={s.visual}>
        <Image
          src="/auth/cinematic-lens.jpg"
          alt="Cinema lens in golden hour light"
          fill
          sizes="50vw"
          priority
        />
        <div className={s.visualShade} />
        <Link className={s.brand} href="/" aria-label="Frame home">
          <FrameMark size={30} />
          frame.
        </Link>
        <div className={s.visualCopy}>
          <span>YOUR FOOTAGE. YOUR VISION.</span>
          <h2>
            Every great story
            <br />
            starts with a frame.
          </h2>
          <p>
            A little less editing.
            <br />A lot more creating.
          </p>
        </div>
        <span className={s.visualFooter}>A creative space that’s yours.</span>
      </div>
      <div className={s.formSide}>
        <Link className={s.mobileBrand} href="/" aria-label="Frame home">
          <FrameMark size={28} />
          frame.
        </Link>
        {children}
        <div className={s.footer}>
          <span>frame. / Your creative space</span>
          <Link href="/">Back to home ↗</Link>
        </div>
      </div>
    </main>
  );
}
