import { ReactNode } from "react";
import { Zap, ShieldCheck, Trophy } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-secondary/40 via-background to-secondary/20">
        {/* Decorative glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--primary) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="max-w-sm">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Welcome to <span className="text-primary">AIExch</span>
            </h1>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              Your trusted platform for secure and exciting exchange with
              real-time odds
            </p>

            {/* Feature highlights */}
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Instant Transactions
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Fast deposits and withdrawals
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Fully Secured
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Bank-grade security for your funds
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Best Odds
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Competitive rates guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edge accents */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile branding */}
        <div className="lg:hidden text-center pt-8 pb-2">
          <h2 className="text-2xl font-bold text-primary">AIExch</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md h-full lg:h-auto flex flex-col justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
