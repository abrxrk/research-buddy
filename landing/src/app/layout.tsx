import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

const title = "Research Buddy — understand research papers with AI";
const description = "Overviews, methods, findings, limitations, knowledge graphs and page-cited answers for any research paper. Ask across your whole library and compare papers side by side.";

export const metadata: Metadata = {
  // Absolute base so the generated preview image URL works in WhatsApp, Slack, X, LinkedIn…
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://research-buddy.abrark.xyz"),
  title,
  description,
  applicationName: "Research Buddy",
  openGraph: { title, description, url: "/", siteName: "Research Buddy", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
