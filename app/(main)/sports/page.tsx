"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sports/all');
  }, [router]);

  return null;
}