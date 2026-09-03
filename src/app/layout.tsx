import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
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
          {/* traffic hub pixel -- see exelentshakil/demo-traffic */}
          <img
            src="https://demo-traffic.vercel.app/api/px?p=prospect-os"
            alt=""
            width={1}
            height={1}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          />
          <Nav />
          <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
