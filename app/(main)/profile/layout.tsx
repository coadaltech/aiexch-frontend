import { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 min-h-full">
      {children}
    </div>
  );
}
