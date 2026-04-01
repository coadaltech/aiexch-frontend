import { Winner } from "@/types";
import {
  Crown,
  Gamepad2,
  Gift,
  HeadphonesIcon,
  Info,
  Users,
} from "lucide-react";

export const winners: Winner[] = [
  { name: "Player123", game: "Mega Fortune", amount: "$12,450" },
  { name: "LuckyAce", game: "Blackjack", amount: "$8,200" },
  { name: "SpinKing", game: "Starburst", amount: "$5,680" },
];

export const paymentMethods: string[] = [
  "Visa",
  "Mastercard",
  "PayPal",
  "Bitcoin",
  "Skrill",
  "Neteller",
];

export const quickLinks = [
  {
    title: "Sports",
    description: "Explore our complete casino collection",
    icon: Gamepad2,
    href: "/sports",
    gradient: "bg-accent ",
  },
  {
    title: "Promotions",
    description: "Latest bonuses and offers",
    icon: Gift,
    href: "/promotions",
    gradient: "from-ql-emerald-from to-ql-emerald-to",
  },
  {
    title: "Profile",
    description: "Manage your account settings",
    icon: Users,
    href: "/profile",
    gradient: "from-ql-purple-from to-ql-purple-to",
  },
  {
    title: "Support",
    description: "24/7 customer assistance",
    icon: HeadphonesIcon,
    href: "/live-support",
    gradient: "from-ql-rose-from to-ql-rose-to",
  },
  {
    title: "VIP Club",
    description: "Exclusive rewards program",
    icon: Crown,
    href: "/vip",
    gradient: "from-ql-amber-from to-ql-amber-to",
  },
  {
    title: "FAQs",
    description: "Exclusive rewards program",
    icon: Info,
    href: "/faqs",
    gradient: "from-ql-orange-from to-ql-orange-to",
  },
];
