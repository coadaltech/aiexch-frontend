"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Shield,
  Award,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

const footerLinks = {
  casino: [
    { name: "Live Casino", href: "/live-casino" },
    { name: "Slots", href: "/slots" },
    { name: "Table Games", href: "/table-games" },
    { name: "Jackpots", href: "/jackpots" },
    { name: "New Games", href: "/new-games" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Contact Us", href: "/support" },
    { name: "FAQ", href: "/faq" },
    { name: "Live Chat", href: "/chat" },
    { name: "Game Rules", href: "/rules" },
  ],
  account: [
    { name: "Sign Up", href: "/register" },
    { name: "Login", href: "/login" },
    { name: "My Account", href: "/account" },
    { name: "Promotions", href: "/promotions" },
    { name: "VIP Program", href: "/vip" },
  ],
  legal: [
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Responsible Gaming", href: "/responsible-gaming" },
    { name: "Licensing", href: "/licensing" },
    { name: "Complaints", href: "/complaints" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

const certifications = [
  { name: "SSL Secured", icon: Shield },
  { name: "Licensed", icon: Award },
  { name: "18+ Only", icon: Users },
];

export default function Footer() {
  const pathname = usePathname();
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");
  if (pathname.includes("/admin") || isAuthRoute) return null;
  return (
    <footer className="bg-muted/20 hidden md:block -mx-4 md:-mx-6 -mb-4 md:-mb-6 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AIEXCH
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Experience the thrill of premium online gaming with our
                world-class casino platform.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-card hover:bg-primary transition-colors duration-300"
                >
                  <social.icon className="h-4 w-4 text-primary" />
                </a>
              ))}
            </div>
          </div>

          {/* Casino Games */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Casino Games</h4>
            <ul className="space-y-2">
              {footerLinks.casino.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-2">
              {footerLinks.account.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm">
                  support@casino.com
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground text-sm">
                  +1 (555) 123-4567
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-muted-foreground text-sm">
                  123 Casino Street
                  <br />
                  Gaming District, GD 12345
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <cert.icon className="h-5 w-5 text-foreground" />
                  <span className="text-foreground text-sm font-medium">
                    {cert.name}
                  </span>
                </div>
              ))}
              <Badge className="p-2">Regulated & Licensed</Badge>
            </div>
          </div>
        </Card>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {footerLinks.legal.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm text-center md:text-left">
              © 2024 Royal Casino. All rights reserved. Licensed and regulated.
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                18+ Only
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Play Responsibly
              </Badge>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Gambling can be addictive. Please play responsibly and within your
              limits. If you need help, contact our support team or visit
              BeGambleAware.org
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
