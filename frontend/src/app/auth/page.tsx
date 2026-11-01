"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AuthForm } from "@/components/auth/AuthForm";
import { Spotlight } from "@/components/landing/Spotlight";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <Spotlight className="flex flex-1 items-center justify-center">
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-4">
        <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white">R</span>
          Research Buddy
        </Link>
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Welcome</CardTitle>
            <CardDescription>Sign in or create an account to start reading smarter.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AuthForm mode="login" />
              </TabsContent>
              <TabsContent value="signup">
                <AuthForm mode="signup" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Spotlight>
  );
}
