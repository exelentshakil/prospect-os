"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Activity, Moon, Radar, ScrollText, Sun, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Pipeline", icon: Radar },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/rubric", label: "Rubric", icon: ScrollText },
];

export function Nav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-white">
            <Activity size={15} strokeWidth={2.6} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Prospect OS</span>
          <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint sm:inline">
            demo
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition",
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-text"
                )}
              >
                <l.icon size={14} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/exelentshakil/prospect-os"
            target="_blank"
            rel="noreferrer"
            className="hidden text-[13px] font-medium text-muted transition hover:text-text sm:block"
          >
            Source
          </a>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted transition hover:text-text"
          >
            {mounted && theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
