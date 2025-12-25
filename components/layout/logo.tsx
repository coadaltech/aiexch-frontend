"use client";

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface LogoProps {
  onClick?: () => void;
  settings?: {
    logo?: string;
    siteName?: string;
  };
}

export default function Logo({ onClick, settings }: LogoProps) {
  if (!settings) {
    return (
      <div className="flex cursor-pointer items-center gap-3 min-w-0">
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 min-w-0"
    >
      {/* Logo */}
      <div className="h-6">
        {settings?.logo && (
          <Image
            src={settings.logo}
            alt="Logo"
            height={24}
            width={120}
            className="h-full w-auto"
          />
        )}
      </div>

      {/* Brand Name */}
      {!settings?.logo && (
        <div className="min-w-0 hover:opacity-80 transition-opacity">
          <h1 className="text-lg sm:text-xl font-bold text-primary">
            {settings?.siteName}
          </h1>
        </div>
      )}
    </div>
  );
}
