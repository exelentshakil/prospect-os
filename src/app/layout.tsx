import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import { TrafficTracker } from "@/components/traffic-tracker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Prospect OS — Autonomous Outbound Engine",
  description:
    "ICP to booked call: sourcing, competitive analysis, leakage detection, deterministic scoring, multi-touch outreach and CRM sync, orchestrated as traced sub-agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <TrafficTracker />
          <Nav />
          <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
