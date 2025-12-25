import { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="md:max-w-md md:mx-auto min-h-screen lg:max-w-6xl">
      {children}
    </div>
  );
}
