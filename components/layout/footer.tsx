"use client";

import Link from "next/link";
import {
  Facebook, Instagram, Youtube, Twitter,
  MessageCircle, Send, Phone, Smartphone,
  Apple, Headphones, Trophy, Gamepad2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { isPanelPath } from "@/lib/panel-utils";

/* ─── Link columns ─── */
const FOOTER_COLS = [
  {
    title: "INFORMATION",
    links: [
      { label: "IPL Betting App",       href: "/sports/cricket" },
      { label: "Cricket World Cup",      href: "/sports/cricket" },
      { label: "Cricket App",            href: "/sports/cricket" },
      { label: "Casino App",             href: "/qtech-casino" },
      { label: "About us",               href: "" },
      { label: "Terms and Conditions",   href: "/terms" },
      { label: "Affiliate Program",      href: "" },
      { label: "Cookie Policy",          href: "/privacy" },
      { label: "Contacts",               href: "/live-support" },
    ],
  },
  {
    title: "BETTING",
    links: [
      { label: "Sports",    href: "/sports" },
      { label: "Cricket",   href: "/sports/cricket" },
      { label: "Matka",     href: "/matka" },
    ],
  },
  {
    title: "GAMES",
    links: [
      { label: "Casino",      href: "/qtech-casino" },
      { label: "Skill Games", href: "/skil-games" },
      { label: "Jambo",       href: "/jambo" },
    ],
  },
  {
    title: "STATISTICS",
    links: [
      { label: "Statistics", href: "/profile/bet-history" },
      { label: "Results",    href: "/profile/account-statement" },
    ],
  },
  {
    title: "USEFUL LINKS",
    links: [
      { label: "Payment methods",    href: "#" },
      { label: "Mobile version",     href: "#" },
      { label: "Registration",       href: "#" },
      { label: "Responsible Gaming", href: "#" },
      { label: "Game Rules",         href: "#" },
      { label: "FAQs",               href: "#" },
    ],
  },
  {
    title: "APPS",
    links: [
      { label: "iOS",        href: "#", icon: Apple },
      { label: "Android",    href: "#", icon: Smartphone },
      { label: "Other apps", href: "#", icon: Gamepad2 },
    ],
  },
];


export default function Footer() {
  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");
  if (isPanelPath(pathname) || isAuthRoute) return null;

  return (
    <footer className="bg-[var(--header-primary)] border-t border-[#1e4088]/60 mt-4">

      {/* ── Section 1: Nav link columns ── */}
      <div className="border-b border-[#1e4088]/40">
        <div className="px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-bold text-[11px] tracking-widest mb-3 font-condensed">
                {col.title}
              </h4>
              <ul className="space-y-1.5">
                {col.links.map((link) => {
                  const Icon = (link as any).icon;
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-1.5 text-[13px] text-white hover:text-white transition-colors leading-snug"
                      >
                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      

    </footer>
  );
}
