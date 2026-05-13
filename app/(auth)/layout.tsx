import { ReactNode } from "react";
import { Zap, ShieldCheck, Trophy, TrendingUp } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ height: "var(--vh-full)" }}
      className="flex flex-col lg:flex-row bg-background overflow-hidden"
    >
      {/* Left Panel - Branding (desktop only) */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1545] via-[#142969] to-[#0a2a42]" />

        {/* Decorative glow orbs */}
        <div className="absolute -top-20 -left-20 w-[28rem] h-[28rem] bg-primary/25 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -right-20 w-[32rem] h-[32rem] bg-accent/20 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] bg-secondary/20 rounded-full blur-[120px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1.2px, transparent 1.2px)",
            backgroundSize: "26px 26px",
          }}
        />

        {/* Floating badge */}
        <div className="absolute top-10 left-10 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/90 text-xs font-medium tracking-wide">
            LIVE • Trusted by 50K+ players
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center w-full px-14 xl:px-20">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 mb-6">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary text-xs font-semibold uppercase tracking-wider">
                Premium Exchange
              </span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-bold text-white mb-5 leading-[1.05] tracking-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                AIExch
              </span>
            </h1>
            <p className="text-white/70 text-lg mb-12 leading-relaxed">
              Your trusted platform for secure and exciting exchange with
              real-time odds.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4">
              <FeatureItem
                icon={<Zap className="w-5 h-5 text-primary" />}
                title="Instant Transactions"
                desc="Fast deposits and withdrawals in seconds"
              />
              <FeatureItem
                icon={<ShieldCheck className="w-5 h-5 text-primary" />}
                title="Fully Secured"
                desc="Bank-grade security for your funds"
              />
              <FeatureItem
                icon={<Trophy className="w-5 h-5 text-primary" />}
                title="Best Odds"
                desc="Competitive rates guaranteed across markets"
              />
            </div>
          </div>
        </div>

        {/* Bottom subtle gradient edge */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </aside>

      {/* Right Panel - Form */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background">
        {/* Mobile branding */}
        <div className="lg:hidden text-center pt-6 pb-2 shrink-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AIExch
          </h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group flex items-start gap-4 p-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-primary/30 transition-all duration-300">
      <div className="w-11 h-11 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-primary/20 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/60 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
