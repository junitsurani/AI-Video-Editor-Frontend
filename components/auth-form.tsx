"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  Check,
  ShieldCheck,
} from "lucide-react";
import { authRequest, AuthError, safeNext } from "@/lib/auth";
import { demoMode } from "@/lib/demo";
import s from "@/app/(auth)/auth.module.css";

type Mode =
  | "login"
  | "signup"
  | "forgot-password"
  | "reset-password"
  | "verify-email";
const content = {
  login: {
    label: "WELCOME BACK",
    title: "Back to your creative space.",
    description: "Sign in and pick up where your story left off.",
    button: "Sign in",
  },
  signup: {
    label: "YOUR NEXT CHAPTER",
    title: "Make room for your ideas.",
    description: "Create your account. Bring your stories to life.",
    button: "Create account",
  },
  "forgot-password": {
    label: "A FRESH START",
    title: "Forgot your password?",
    description: "Enter your email and we’ll send you a reset link.",
    button: "Send reset link",
  },
  "reset-password": {
    label: "A FRESH START",
    title: "Choose a new password.",
    description: "A little reset. Then back to creating.",
    button: "Save new password",
  },
  "verify-email": {
    label: "ONE LAST STEP",
    title: "Your studio is almost ready.",
    description: "Confirm your email to finish setting up your account.",
    button: "Verify email",
  },
};
export function AuthForm({ mode: requestedMode }: { mode: Mode }) {
  const mode = demoMode ? "login" : requestedMode;
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const copy = content[mode];
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifyNeeded, setVerifyNeeded] = useState(false);
  const [resent, setResent] = useState(false);
  const target = (path: string) => `${path}?next=${encodeURIComponent(next)}`;
  const hasPassword = ["login", "signup", "reset-password"].includes(mode);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (mode === "reset-password" && password !== confirmation) {
      setError("Your passwords don’t match. Please try again.");
      return;
    }
    setBusy(true);
    try {
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        "token",
      );
      if ((mode === "verify-email" || mode === "reset-password") && !token)
        throw new Error("This link is incomplete. Request a new link below.");
      const result = await authRequest<{ message?: string }>("/" + mode, {
        email,
        name,
        password,
        remember,
        token,
      });
      setPassword("");
      setConfirmation("");
      if (mode === "login") {
        window.location.assign(next);
        return;
      }
      if (mode === "verify-email" || mode === "reset-password")
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      setSuccess(
        result.message ||
          "Your email is verified. Your creative space is ready.",
      );
    } catch (e) {
      if (e instanceof AuthError && e.code === "email_unverified")
        setVerifyNeeded(true);
      else setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    try {
      await authRequest("/resend-verification", { email });
      setResent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const inbox =
    (success && (mode === "signup" || mode === "forgot-password")) ||
    verifyNeeded;
  if (inbox || success) {
    return (
      <div className={s.formContent}>
        <span className={s.successIcon}>
          {inbox ? <Mail size={25} /> : <Check size={25} />}
        </span>
        <span className={s.eyebrow}>
          {inbox ? "CHECK YOUR INBOX" : "ALL SET"}
        </span>
        <h1>
          {inbox
            ? "Check your email."
            : mode === "reset-password"
              ? "A fresh start, secured."
              : "Welcome to frame."}
        </h1>
        <p className={s.description}>
          {inbox ? (
            <>
              If an account action is available, we’ve sent a link to{" "}
              <strong>{email}</strong>. Open it to{" "}
              {mode === "forgot-password"
                ? "reset your password"
                : "verify your email"}
              .
            </>
          ) : (
            success
          )}
        </p>
        {inbox && (
          <p className={s.note}>
            Check your spam folder too. Verification links expire after an hour;
            reset links after 30 minutes.
          </p>
        )}
        {error && (
          <div role="alert" className={s.error}>
            {error}
          </div>
        )}
        {mode === "verify-email" && success ? (
          <Link className={s.submit} href={next}>
            Enter your studio <ArrowRight size={16} />
          </Link>
        ) : (
          <Link className={s.submit} href={target("/login")}>
            Back to sign in <ArrowRight size={16} />
          </Link>
        )}
        {inbox && mode !== "forgot-password" && (
          <button
            className={s.textButton}
            onClick={resend}
            disabled={busy || resent}
          >
            {busy
              ? "Sending…"
              : resent
                ? "New verification link sent"
                : "Resend verification email"}
          </button>
        )}
        {inbox && mode === "forgot-password" && (
          <button
            className={s.textButton}
            onClick={() => {
              setSuccess("");
              setError("");
            }}
          >
            Try another email
          </button>
        )}
      </div>
    );
  }
  return (
    <div className={s.formContent}>
      <span className={s.eyebrow}>{copy.label}</span>
      <h1>{copy.title}</h1>
      <p className={s.description}>
        {demoMode
          ? "Use your test account to explore the dashboard."
          : copy.description}
      </p>
      <form onSubmit={submit} className={s.form}>
        {mode === "signup" && (
          <label htmlFor="name">
            Your name
            <input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              disabled={busy}
            />
          </label>
        )}
        {["login", "signup", "forgot-password"].includes(mode) && (
          <label htmlFor="email">
            Email address
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              disabled={busy}
            />
          </label>
        )}
        {hasPassword && (
          <label htmlFor="password">
            {mode === "reset-password" ? "New password" : "Password"}
            <span className={s.passwordField}>
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder={
                  mode === "login"
                    ? "Enter your password"
                    : "At least 12 characters"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "login" ? 1 : 12}
                maxLength={128}
                aria-describedby={
                  mode === "login" ? undefined : "password-hint"
                }
                disabled={busy}
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
        )}
        {hasPassword && mode !== "login" && (
          <span id="password-hint" className={s.hint}>
            Use 12–128 characters. A unique passphrase works well.
          </span>
        )}
        {mode === "reset-password" && (
          <label htmlFor="confirmation">
            Confirm new password
            <input
              id="confirmation"
              name="confirmation"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
              minLength={12}
              maxLength={128}
              disabled={busy}
            />
          </label>
        )}
        {mode === "login" && (
          <div className={s.options}>
            <label className={s.checkbox}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={busy}
              />
              Remember me
            </label>
            {!demoMode && (
              <Link href={target("/forgot-password")}>Forgot password?</Link>
            )}
          </div>
        )}
        {mode === "verify-email" && (
          <div className={s.verifyCard}>
            <ShieldCheck size={24} />
            <p>
              This confirms you own the email address used to create your Frame
              account.
            </p>
          </div>
        )}
        {error && (
          <div className={s.error} role="alert">
            {error}
          </div>
        )}
        <button className={s.submit} type="submit" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="spin" size={17} />{" "}
              {mode === "login" ? "Signing in…" : "Just a moment…"}
            </>
          ) : (
            <>
              {copy.button}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      {mode === "login" && !demoMode && (
        <p className={s.switch}>
          New to Frame? <Link href={target("/signup")}>Create an account</Link>
        </p>
      )}
      {mode === "signup" && (
        <p className={s.switch}>
          Already have an account? <Link href={target("/login")}>Sign in</Link>
        </p>
      )}
      {mode === "forgot-password" && (
        <Link href={target("/login")} className={s.back}>
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      )}
      {mode === "reset-password" && (
        <Link href={target("/forgot-password")} className={s.back}>
          Need a new reset link?
        </Link>
      )}
      {mode === "verify-email" && (
        <Link href={target("/login")} className={s.back}>
          Link expired? Sign in to request another.
        </Link>
      )}
    </div>
  );
}
