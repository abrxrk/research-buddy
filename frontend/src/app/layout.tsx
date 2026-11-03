import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { StoreHydrator } from "@/components/providers/StoreHydrator";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Research Buddy", template: "%s · Research Buddy" },
  applicationName: "Research Buddy",
  description: "Understand research papers with AI: overviews, findings, knowledge graphs and cited Q&A.",
};

export const viewport: Viewport = { themeColor: "#161618", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <StoreHydrator />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
