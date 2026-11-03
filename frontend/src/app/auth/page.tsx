"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";

import { AuthForm, type AuthMode, LAST_EMAIL_KEY } from "@/components/auth/AuthForm";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { Logo } from "@/components/layout/Logo";
import { LANDING_URL } from "@/helpers/urls";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const noop = () => () => {};
/** Last email that signed in here (set on success in AuthForm). "" during SSR so hydration matches. */
const useSavedEmail = () => useSyncExternalStore(noop, () => localStorage.getItem(LAST_EMAIL_KEY) ?? "", () => "");

export default function AuthPage() {
  // useSearchParams needs a Suspense boundary; the fallback is the same page without the form state.
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <AuthScreen />
    </Suspense>
  );
}

function AuthScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  // URL-synced: /auth?mode=signup deep-links to "Create account" (used by the landing site too).
  const mode: AuthMode = params.get("mode") === "signup" ? "signup" : "login";
  const signup = mode === "signup";

  const saved = useSavedEmail();
  const [typed, setTyped] = useState<string | null>(null);
  const email = typed ?? saved;

  useDocumentTitle(signup ? "Create account" : "Sign in");

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  // Native history API: Next syncs it with useSearchParams without an RSC fetch or re-applying layout metadata (which would clobber document.title).
  const setMode = (next: AuthMode) => window.history.replaceState(null, "", next === "signup" ? "/auth?mode=signup" : "/auth");

  if (user) return null; // redirecting

  return (
    <main className="grid min-h-screen flex-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo href={LANDING_URL} />
          <a href={LANDING_URL} className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground">
            Back to site
          </a>
        </div>

        {/* Vertically centred in the column, level with the panel on the right. */}
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="text-2xl font-semibold tracking-tight">{signup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {signup ? "Already have an account? " : "New to Research Buddy? "}
            <button
              type="button"
              onClick={() => setMode(signup ? "login" : "signup")}
              className="rounded-sm text-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-highlight"
            >
              {signup ? "Sign in" : "Create an account"}
            </button>
          </p>

          <div className="mt-8">
            {/* key: a fresh form per mode, so validation state doesn't leak between sign in and sign up */}
            <AuthForm
              key={mode}
              mode={mode}
              email={email}
              onEmailChange={setTyped}
              focusPassword={!signup && !!saved}
              onSwitchMode={setMode}
            />
          </div>
        </div>
      </div>

      <aside className="hidden border-l bg-card/40 px-10 py-16 lg:flex lg:items-center xl:px-16">
        <AuthShowcase />
      </aside>
    </main>
  );
}
