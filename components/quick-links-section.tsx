import Link from "next/link";
import { quickLinks } from "@/data";

export default function QuickLinksSection() {
  return (
    <section className="py-4">
      <div className="">
        {/* Section Header */}
        <div className="mb-6">
          <div className="relative group inline-block">
            <div className="absolute -inset-1 opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-amber-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent animate-gradient">
                QUICK LINKS
              </h2>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {quickLinks.map((link, index) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={index}
                href={link.href}
                className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-primary/30 hover:border-primary/70 transition-all duration-500 hover:scale-110 hover:-translate-y-1 cursor-pointer text-center block overflow-hidden"
              >
                {/* Glowing effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-amber-500 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10"></div>
                
                {/* Animated shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="flex flex-col items-center relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/20 to-amber-500/20 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-primary/30 border border-primary/30 group-hover:border-primary/60">
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-primary group-hover:text-amber-400 transition-colors duration-300" />
                  </div>
                  <h3 className="text-slate-200 font-semibold md:text-sm text-xs text-nowrap group-hover:text-primary transition-colors duration-300">
                    {link.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
