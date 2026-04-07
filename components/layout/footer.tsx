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
      { label: "IPL Betting App",       href: "/promotions" },
      { label: "Cricket World Cup",      href: "/sports/cricket" },
      { label: "Cricket App",            href: "/sports/cricket" },
      { label: "Casino App",             href: "/casino" },
      { label: "About us",               href: "/about" },
      { label: "Terms and Conditions",   href: "/terms" },
      { label: "Affiliate Program",      href: "/affiliate" },
      { label: "Cookie Policy",          href: "/privacy" },
      { label: "Contacts",               href: "/live-support" },
    ],
  },
  {
    title: "BETTING",
    links: [
      { label: "Sports",    href: "/sports" },
      { label: "Cricket",   href: "/sports/cricket" },
      { label: "Live",      href: "/sports/all" },
      { label: "Matka",     href: "/matka" },
    ],
  },
  {
    title: "GAMES",
    links: [
      { label: "Casino",      href: "/casino" },
      { label: "Live Casino", href: "/live-casino" },
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
      { label: "Payment methods",    href: "/promotions" },
      { label: "Mobile version",     href: "/" },
      { label: "Registration",       href: "/signup" },
      { label: "Responsible Gaming", href: "/responsible-gaming" },
      { label: "Game Rules",         href: "/game-rules" },
      { label: "FAQs",               href: "/faqs" },
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

/* ─── Partners (text logos, styled) ─── */
const PARTNERS = [
  { name: "FCB",        color: "#a50044", bg: "#004d98", type: "sport" },
  { name: "SERIE A",    color: "#fff",    bg: "#1a1a2e", type: "sport" },
  { name: "PSG",        color: "#fff",    bg: "#004170", type: "sport" },
  { name: "CAF",        color: "#fff",    bg: "#006633", type: "sport" },
  { name: "VB WORLD",  color: "#fff",    bg: "#0055a6", type: "sport" },
  { name: "NEXO",       color: "#fff",    bg: "#1b3a6b", type: "sport" },
  { name: "FIBA",       color: "#fff",    bg: "#e63946", type: "sport" },
  { name: "BJK CUP",   color: "#fff",    bg: "#2d6a4f", type: "sport" },
  { name: "MPBL",       color: "#fff",    bg: "#1d1d2e", type: "sport" },
  { name: "PGL",        color: "#fff",    bg: "#f4a261", type: "esport" },
  { name: "mibr",       color: "#fff",    bg: "#c1121f", type: "esport" },
  { name: "NAVI",       color: "#f5c518", bg: "#1a1a1a", type: "esport" },
  { name: "ASTRALIS",   color: "#e63946", bg: "#14213d", type: "esport" },
  { name: "FNATIC",     color: "#ff6600", bg: "#1a1a1a", type: "esport" },
];

/* ─── Social media links ─── */
const SOCIALS = [
  { Icon: MessageCircle, label: "WhatsApp", href: "#", color: "#25d366" },
  { Icon: Facebook,      label: "Facebook", href: "#", color: "#1877f2" },
  { Icon: Instagram,     label: "Instagram",href: "#", color: "#e1306c" },
  { Icon: Send,          label: "Telegram", href: "#", color: "#0088cc" },
  { Icon: Youtube,       label: "YouTube",  href: "#", color: "#ff0000" },
  { Icon: Twitter,       label: "X / Twitter", href: "#", color: "#1da1f2" },
];

/* ─── Payment methods ─── */
const PAYMENTS = [
  { name: "G Pay",        style: "text-white bg-[#1a73e8]" },
  { name: "PhonePe",      style: "text-white bg-[#5f259f]" },
  { name: "UPI",          style: "text-white bg-[#007bff]" },
  { name: "Paytm",        style: "text-white bg-[#00baf2]" },
  { name: "NET Banking",  style: "text-white bg-[#1e4d8c]" },
  { name: "Jio Pay",      style: "text-white bg-[#0033a0]" },
  { name: "Neteller",     style: "text-white bg-[#1a1a2e]" },
  { name: "TRON",         style: "text-red-400 bg-[#1a1a1a]" },
  { name: "Bitcoin",      style: "text-[#f7931a] bg-[#1a1a1a]" },
  { name: "USDT",         style: "text-[#26a17b] bg-[#1a1a1a]" },
];

export default function Footer() {
  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");
  if (isPanelPath(pathname) || isAuthRoute) return null;

  return (
    <footer className="bg-gradient-to-b from-[#142969] via-[#142669] to-[#84c2f1] border-t border-[#1e4088]/60 mt-4">

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
                        className="flex items-center gap-1.5 text-[12px] text-white/55 hover:text-white transition-colors leading-snug"
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

      {/* ── Section 2: Partners ── */}
      <div className="border-b border-[#1e4088]/40 py-4">
        <p className="text-white/40 text-[10px] font-bold tracking-widest px-4 sm:px-6 mb-3 font-condensed">
          PARTNERS
        </p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-1">
          {PARTNERS.map((p) => (
            <div key={p.name} className="shrink-0 flex flex-col items-center gap-1.5">
              {/* trophy/gamepad icon above */}
              <div className="text-white/30">
                {p.type === "esport"
                  ? <Gamepad2 className="h-3 w-3" />
                  : <Trophy className="h-3 w-3" />
                }
              </div>
              {/* Logo pill */}
              <div
                className="w-16 h-10 rounded-lg flex items-center justify-center text-[9px] font-bold tracking-wide border border-white/10"
                style={{ background: p.bg, color: p.color }}
              >
                {p.name}
              </div>
            </div>
          ))}
        </div>
        {/* Thin progress indicator bar (decorative, like 1xBet) */}
        <div className="mx-4 sm:mx-6 mt-3 h-[3px] bg-[#1e4088]/40 rounded-full">
          <div className="h-full w-1/3 bg-[#84c2f1] rounded-full" />
        </div>
      </div>

      {/* ── Section 3: Copyright / Support / Social ── */}
      <div className="border-b border-[#1e4088]/40">
        <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#1e4088]/40">

          {/* Copyright */}
          <div className="px-4 sm:px-6 py-4 flex flex-col justify-center">
            <p className="text-white/70 text-[11px] font-semibold mb-1">
              Copyright © {new Date().getFullYear()} AIEXCH.
            </p>
            <p className="text-white/35 text-[10px] leading-relaxed">
              AIEXCH uses cookies to ensure the best user experience. By remaining
              on the website, you consent to use of cookies.{" "}
              <Link href="/privacy" className="text-[#84c2f1] underline-offset-2 hover:underline">
                Find out more
              </Link>
            </p>
          </div>

          {/* Customer Support */}
          <div className="px-4 sm:px-6 py-4 flex items-center gap-4">
            <div className="bg-[#1a3578] p-3 rounded-full shrink-0">
              <Headphones className="h-6 w-6 text-white/80" />
            </div>
            <div>
              <p className="text-white/40 text-[9px] font-bold tracking-widest mb-1 font-condensed">
                CUSTOMER SUPPORT
              </p>
              <div className="space-y-0.5">
                <a href="tel:+918000000001" className="flex items-center gap-1.5 text-white text-xs hover:text-[#84c2f1] transition-colors">
                  <Phone className="h-3 w-3 text-[#84c2f1]" />
                  +91 800 000 0001
                </a>
                <a href="tel:+918000000002" className="flex items-center gap-1.5 text-white text-xs hover:text-[#84c2f1] transition-colors">
                  <Phone className="h-3 w-3 text-[#84c2f1]" />
                  +91 800 000 0002
                </a>
                <Link href="/live-support" className="flex items-center gap-1.5 text-[#84c2f1] text-xs hover:text-white transition-colors mt-1">
                  <MessageCircle className="h-3 w-3" />
                  Live Chat
                </Link>
              </div>
            </div>
          </div>

          {/* Social + 18+ + Mobile Version */}
          <div className="px-4 sm:px-6 py-4 flex flex-col gap-3">
            {/* Social icons row */}
            <div className="flex items-center gap-2 flex-wrap">
              {SOCIALS.map(({ Icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-[#1e4088] bg-[#0b1545] hover:scale-110 transition-transform"
                  style={{ "--icon-color": color } as React.CSSProperties}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </a>
              ))}
              {/* 18+ badge */}
              <div className="ml-auto w-9 h-9 rounded-full border-2 border-white/30 flex items-center justify-center">
                <span className="text-white font-black text-[11px] font-condensed">18+</span>
              </div>
            </div>

            {/* Mobile version button */}
            <button className="w-full sm:w-auto px-4 py-2 bg-[#1a3578] hover:bg-[#1e4088] border border-[#1e4088] rounded-lg text-white text-xs font-bold tracking-widest font-condensed transition-colors">
              MOBILE VERSION
            </button>
          </div>

        </div>
      </div>

      {/* ── Section 4: Payment methods ── */}
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {PAYMENTS.map((p) => (
          <div
            key={p.name}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide border border-white/10 ${p.style}`}
          >
            {p.name}
          </div>
        ))}
      </div>

    </footer>
  );
}
