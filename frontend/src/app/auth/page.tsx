"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AuthForm } from "@/components/auth/AuthForm";
import { PaperDemo } from "@/components/landing/PaperDemo";
import { Logo } from "@/components/layout/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <main className="grid min-h-screen flex-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <Logo />
        <div className="animate-pop mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Welcome to your <span className="font-serif font-normal italic">reading room.</span>
          </h1>
          <p className="mt-3 mb-8 text-sm text-muted-foreground">Sign in or create an account to start understanding papers faster.</p>
          <Tabs defaultValue="login">
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><AuthForm mode="login" /></TabsContent>
            <TabsContent value="signup"><AuthForm mode="signup" /></TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="relative hidden overflow-hidden border-l bg-card/40 lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        <div aria-hidden className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-highlight/10 blur-3xl" />
        <div className="animate-tilt-in relative">
          <PaperDemo compact />
        </div>
        <blockquote className="relative mt-10 max-w-md">
          <p className="font-serif text-2xl leading-snug italic">“Like having a co-author who has already read every page.”</p>
          <footer className="mt-3 text-sm text-muted-foreground">Research Buddy · highlights, notes and cited answers</footer>
        </blockquote>
      </div>
    </main>
  );
}
