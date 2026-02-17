import { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 min-h-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden py-4 sm:py-6">
      {children}
    </div>
  );
}
