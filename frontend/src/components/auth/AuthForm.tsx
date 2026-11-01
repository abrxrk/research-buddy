"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setLoading(true);
    try {
      const res = signup
        ? await authApi.signup(email, password, String(form.get("name") || ""))
        : await authApi.login(email, password);
      setSession(res.token, res.user);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {signup && (
        <div className="grid gap-2">
          <Label htmlFor={`${mode}-name`}>Name</Label>
          <Input id={`${mode}-name`} name="name" placeholder="Ada Lovelace" autoComplete="name" />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input id={`${mode}-email`} name="email" type="email" required placeholder="you@university.edu" autoComplete="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          name="password"
          type="password"
          required
          minLength={signup ? 8 : undefined}
          maxLength={72}
          placeholder={signup ? "At least 8 characters" : "••••••••"}
          autoComplete={signup ? "new-password" : "current-password"}
        />
      </div>
      <Button type="submit" disabled={loading} className="h-10 rounded-md">
        {loading && <Loader2 className="animate-spin" />}
        {signup ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
