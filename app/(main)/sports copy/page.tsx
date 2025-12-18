"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sports/-4');
  }, [router]);

  return null;
}