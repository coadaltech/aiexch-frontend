import Link from "next/link";
import { quickLinks } from "@/data";

export default function QuickLinksSection() {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3 px-1">
        <div className="w-1 h-5 bg-[#79a430] rounded-full" />
        <h2 className="text-sm font-bold text-white font-condensed tracking-wide">
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
              className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#0a2a42] border border-[#1b5785]/50 hover:border-[#66c4ff]/50 hover:bg-[#0f3d5e] transition-all duration-200 text-center"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#174b73] group-hover:bg-[#1b5785] flex items-center justify-center transition-colors border border-[#1b5785] group-hover:border-[#66c4ff]/30">
                <IconComponent className="w-5 h-5 text-[#66c4ff] group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-white/70 group-hover:text-white transition-colors font-medium leading-tight">
                {link.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
