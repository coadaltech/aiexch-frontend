"use client";

import Link from "next/link";
import { Facebook, Youtube, Instagram, Twitter, MessageCircle } from "lucide-react";

/**
 * TomExch footer — policy links, brand logo, 18+ mark, social icons and a
 * copyright line, on a light canvas. Rendered at the bottom of the TomExch
 * shell's scroll area on every page.
 */
const LINKS = [
  { label: "Cookie Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Gambling can be addictive", href: "/responsible-gaming" },
  { label: "Parental Supervision,", href: "/responsible-gaming" },
  { label: "Help & Contact us", href: "/contact" },
];

const SOCIALS = [
  { Icon: Facebook, bg: "bg-[#1877f2]", label: "Facebook" },
  { Icon: Youtube, bg: "bg-[#ff0000]", label: "YouTube" },
  { Icon: MessageCircle, bg: "bg-[#00aff0]", label: "Skype" },
  { Icon: Instagram, bg: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]", label: "Instagram" },
  { Icon: Twitter, bg: "bg-black", label: "X" },
];

export function TomexchFooter() {
  return (
    <footer className="mt-2 w-full border-t border-slate-300 bg-[#f1f3f5] px-4 py-8 text-slate-800">
      {/* Policy links */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {LINKS.map((l, i) => (
          <span key={l.label} className="flex items-center gap-x-3">
            <Link href={l.href} className="text-[15px] font-bold hover:underline">
              {l.label}
            </Link>
            {i < LINKS.length - 1 && <span className="text-slate-400">|</span>}
          </span>
        ))}
      </div>

      {/* Brand + 18+ */}
      <div className="mt-8 flex items-center justify-between">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900">
          TOM<span className="font-black">EXCH</span>
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-slate-900 text-lg font-bold text-slate-900">
          18+
        </span>
      </div>

      {/* Social icons */}
      <div className="mt-6 flex items-center justify-center gap-5">
        {SOCIALS.map(({ Icon, bg, label }) => (
          <a
            key={label}
            href="#"
            aria-label={label}
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm ${bg}`}
          >
            <Icon className="h-6 w-6" />
          </a>
        ))}
      </div>

      {/* Copyright */}
      <p className="mt-7 text-center text-lg text-slate-600">
        © 2025 TOM Exchange. All rights reserved.
      </p>
    </footer>
  );
}
