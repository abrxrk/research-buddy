"use client";

import { ArrowUpFromLine, Check, CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { authApi } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tip } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup";

/** localStorage key for the last email that signed in successfully (prefilled next time). */
export const LAST_EMAIL_KEY = "rb-last-email";

const FIELD = "h-10 rounded-md bg-card px-3 dark:bg-card";
const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  mode: AuthMode;
  /** Shared with the page so a typed email survives switching between sign in and create account. */
  email: string;
  onEmailChange: (email: string) => void;
  /** Focus the password field instead of email (when the email was prefilled). */
  focusPassword?: boolean;
  onSwitchMode: (mode: AuthMode) => void;
};

function emailError(email: string) {
  if (!email.trim()) return "Enter your email address";
  if (!EMAIL_RE.test(email.trim())) return "That doesn't look like an email address";
  return null;
}

function passwordError(password: string, signup: boolean) {
  if (!password) return "Enter your password";
  if (signup && password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`;
  return null;
}

/** 0–4. Length does most of the work; mixing character types adds a little. */
function strength(p: string) {
  let s = 0;
  if (p.length >= MIN_PASSWORD) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) || /[^\w\s]/.test(p)) s++;
  return p.length < MIN_PASSWORD ? Math.min(s, 1) : s;
}
const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];

/** Turns API/network errors into plain language. */
function friendlyError(err: unknown): { text: string; code?: "exists" | "wrong" } {
  if (err instanceof ApiError) {
    if (err.status === 401) return { text: "Wrong email or password. Check both and try again.", code: "wrong" };
    if (err.status === 409) return { text: "An account with this email already exists.", code: "exists" };
    if (err.status === 429) return { text: "Too many attempts. Wait a minute, then try again." };
    if (err.status >= 500) return { text: "The server had a problem. Try again in a moment." };
    return { text: err.message };
  }
  if (err instanceof TypeError) return { text: "Can't reach the server. Check your connection and try again." };
  return { text: "Something went wrong. Try again." };
}

export function AuthForm({ mode, email, onEmailChange, focusPassword, onSwitchMode }: Props) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const signup = mode === "signup";
  const id = useId();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReturnType<typeof friendlyError> | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Autofocus: email normally, password when the email was remembered from last time.
  useEffect(() => {
    (focusPassword ? passwordRef : emailRef).current?.focus();
  }, [focusPassword]);

  const emailErr = touched.email ? emailError(email) : null;
  const passwordErr = touched.password ? passwordError(password, signup) : null;
  const score = strength(password);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError(email)) return emailRef.current?.focus();
    if (passwordError(password, signup)) return passwordRef.current?.focus();

    const form = new FormData(e.currentTarget);
    const cleanEmail = email.trim();
    setError(null);
    setLoading(true);
    try {
      const res = signup
        ? await authApi.signup(cleanEmail, password, String(form.get("name") || "").trim())
        : await authApi.login(cleanEmail, password);
      localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
      setSession(res.token, res.user);
      router.push("/dashboard");
    } catch (err) {
      const friendly = friendlyError(err);
      setError(friendly);
      setLoading(false);
      // Put the cursor where the fix most likely is; for retry-able errors just keep focus on the button.
      requestAnimationFrame(() => {
        if (friendly.code === "exists") emailRef.current?.focus();
        else if (friendly.code === "wrong") passwordRef.current?.select();
        else submitRef.current?.focus();
      });
    }
  }

  // Only reference the strength hint while it is actually rendered.
  const hintId = signup && password && !passwordErr ? `${id}-password-hint` : undefined;

  const describedBy = (field: "email" | "password", err: string | null, extra?: string) =>
    [err && `${id}-${field}-error`, extra].filter(Boolean).join(" ") || undefined;

  return (
    // method="post" so credentials never end up in the URL if JavaScript fails to load;
    // noValidate so our inline messages replace the browser bubbles.
    <form method="post" noValidate onSubmit={onSubmit} className="grid gap-5">
      <fieldset disabled={loading} className="contents">
        {signup && (
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-name`} className="font-normal text-muted-foreground">
              Name <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input className={FIELD} id={`${id}-name`} name="name" placeholder="Ada Lovelace" autoComplete="name" maxLength={80} />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-email`} className="font-normal text-muted-foreground">Email</Label>
          <Input
            ref={emailRef}
            id={`${id}-email`}
            className={FIELD}
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              if (error) setError(null);
            }}
            // Only validate on blur once something was typed; tabbing past an empty field shouldn't shout.
            onBlur={() => email && setTouched((t) => ({ ...t, email: true }))}
            placeholder="you@university.edu"
            autoComplete="email"
            aria-invalid={emailErr ? true : undefined}
            aria-describedby={describedBy("email", emailErr)}
          />
          <FieldError id={`${id}-email-error`} message={emailErr} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-password`} className="font-normal text-muted-foreground">Password</Label>
          <div className="relative">
            <Input
              ref={passwordRef}
              id={`${id}-password`}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              onBlur={() => {
                if (password) setTouched((t) => ({ ...t, password: true }));
                setCapsLock(false);
              }}
              onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
              onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
              minLength={signup ? MIN_PASSWORD : undefined}
              maxLength={72}
              placeholder={signup ? `At least ${MIN_PASSWORD} characters` : "Your password"}
              autoComplete={signup ? "new-password" : "current-password"}
              className={cn(FIELD, "pr-10")}
              aria-invalid={passwordErr ? true : undefined}
              aria-describedby={describedBy("password", passwordErr, hintId)}
            />
            <Tip content={showPassword ? "Hide password" : "Show password"}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </Tip>
          </div>
          <FieldError id={`${id}-password-error`} message={passwordErr} />
          {capsLock && !passwordErr && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
              <ArrowUpFromLine className="size-3.5" aria-hidden />
              Caps Lock is on
            </p>
          )}
          {signup && password && !passwordErr && <StrengthHint id={`${id}-password-hint`} score={score} length={password.length} />}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-foreground">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
            <span>
              <span className="block">{error.text}</span>
              {error.code === "exists" && (
                <button type="button" onClick={() => onSwitchMode("login")} className="rounded-sm font-medium underline underline-offset-4 hover:text-highlight">
                  Sign in instead
                </button>
              )}
            </span>
          </div>
        )}

        <Button ref={submitRef} type="submit" variant="accent" className="mt-2 h-10 w-full rounded-md" disabled={loading} aria-live="polite">
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {loading ? (signup ? "Creating account…" : "Signing in…") : signup ? "Create account" : "Sign in"}
        </Button>
      </fieldset>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-xs text-destructive">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/** Four-segment meter plus a plain label. Only the strength word is announced, not every "N more characters" keystroke. */
function StrengthHint({ id, score, length }: { id: string; score: number; length: number }) {
  const missing = MIN_PASSWORD - length;
  return (
    <div id={id} className="grid gap-1.5">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full bg-border transition-colors duration-150", i <= score && "bg-foreground/80")} />
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
        {score >= 3 && <Check className="size-3.5 text-emerald-500" aria-hidden />}
        {missing > 0 && `${missing} more character${missing === 1 ? "" : "s"} needed`}
        <span aria-live="polite" aria-atomic>
          {missing <= 0 && STRENGTH_LABEL[score]}
        </span>
        {missing <= 0 && score < 3 && " · longer or mixed characters make it stronger"}
      </p>
    </div>
  );
}
