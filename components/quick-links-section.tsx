import Link from "next/link";
import { quickLinks } from "@/data";

export default function QuickLinksSection() {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <div className="w-1 h-5 bg-[var(--header-secondary)] rounded-full" />
        <h2 className="text-sm font-bold text-gray-900 font-condensed tracking-wide">
          QUICK LINKS
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {quickLinks.map((link, index) => {
          const IconComponent = link.icon;
          return (
            <Link
              key={index}
              href={link.href}
              className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white border border-gray-200 hover:border-[var(--header-primary)]/30 hover:bg-gray-50 shadow-sm transition-all duration-200 text-center"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-[var(--header-primary)] to-[var(--header-secondary)] group-hover:from-[#1a3578] group-hover:to-[var(--header-primary)] flex items-center justify-center transition-colors border border-[#1e4088]/30">
                <IconComponent className="w-5 h-5 text-white transition-colors" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-gray-600 group-hover:text-gray-900 transition-colors font-medium leading-tight">
                {link.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
