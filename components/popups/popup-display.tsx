"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { usePublicPopups } from "@/hooks/useUserQueries";

interface Popup {
  id: number;
  title: string;
  imageUrl: string;
  targetPage: string;
  status: string;
}

export function PopupDisplay() {
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null);
  const [currentPath, setCurrentPath] = useState<string>("");

  const { data: popups = [], error, isLoading } = usePublicPopups(currentPath);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (popups.length > 0 && !currentPopup && currentPath) {
      const closedPopups = JSON.parse(
        sessionStorage.getItem("closedPopups") || "[]"
      );

      const nextPopup = popups.find((popup: Popup) => {
        if (popup.status !== "active") return false;
        if (closedPopups.includes(popup.id)) return false;

        if (popup.targetPage === "home") return currentPath === "/";
        return currentPath.includes(`/${popup.targetPage}`);
      });

      if (nextPopup) {
        const timer = setTimeout(() => setCurrentPopup(nextPopup), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [popups, currentPath, currentPopup]);

  const handleClose = () => {
    if (currentPopup) {
      const closedPopups = JSON.parse(
        sessionStorage.getItem("closedPopups") || "[]"
      );
      sessionStorage.setItem(
        "closedPopups",
        JSON.stringify([...closedPopups, currentPopup.id])
      );
      setCurrentPopup(null);
    }
  };

  if (error || isLoading) return null;

  return (
    <Dialog open={!!currentPopup} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-4 border-none bg-transparent ">
        <VisuallyHidden.Root>
          <DialogTitle>{currentPopup?.title || "Popup"}</DialogTitle>
        </VisuallyHidden.Root>
        {currentPopup && (
          <Image
            src={currentPopup.imageUrl}
            alt={currentPopup.title}
            width={1200}
            height={800}
            className="w-full h-auto rounded-lg"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
