"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name")?.trim() || "This game";

  return (
    <div className="bg-gray-50 min-h-full w-full">
      <div className="px-3 py-6">
        <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50 shadow-md">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />
          <div className="relative flex flex-col items-center text-center px-6 py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 border border-amber-200 mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Coming Soon
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-condensed tracking-wide">
              {name} is on its way
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-md">
              We&apos;re getting things ready behind the scenes. Check back
              soon to start playing.
            </p>
            <Link
              href="/sports"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--header-primary)] hover:text-[var(--header-secondary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Browse other sports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<div className="min-h-full" />}>
      <ComingSoonContent />
    </Suspense>
  );
}
