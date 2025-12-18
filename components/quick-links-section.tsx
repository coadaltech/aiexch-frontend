import Link from "next/link";
import { quickLinks } from "@/data";

export default function QuickLinksSection() {
  return (
    <section className="py-4">
      <div className="">
        {/* Section Header */}
        <div className=" mb-4">
          <h2 className="text-xl font-semibold text-primary mb-4">
            QUICK LINKS
          </h2>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickLinks.map((link, index) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={index}
                href={link.href}
                className="group relative bg-card/40 backdrop-blur-2xl rounded-md p-4 border border-primary/30 transition-all duration-300 hover:scale-105 hover:bg-card/60 cursor-pointer text-center block"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-lg`}
                  >
                    <IconComponent className="w-6 h-6 text-primary " />
                  </div>
                  <h3 className="text-foreground font-semibold md:text-sm text-xs text-nowrap group-hover:text-primary transition-colors duration-300">
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
