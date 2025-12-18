import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* <Link
        href="/"
        className="absolute top-4 left-4 z-10 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link> */}
      {/* <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Welcome to Casino
          </h1>
          <p className="text-muted-foreground text-lg">
            Experience the thrill of gaming with secure and exciting gameplay
          </p>
        </div>
      </div> */}
      <div className="flex-1 flex flex-col lg:items-center lg:justify-center lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md h-full lg:h-auto">{children}</div>
      </div>
    </div>
  );
}
