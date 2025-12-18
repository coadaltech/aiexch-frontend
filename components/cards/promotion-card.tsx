"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";

interface Promotion {
  id: number;
  title: string;
  description?: string;
  type: string;
  value?: string;
  imageUrl?: string;
  status: string;
}

interface PromotionCardProps {
  promotion: Promotion;
  variant?: "image-only" | "content";
}

export function PromotionCard({
  promotion,
  variant = "content",
}: PromotionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === "image-only") {
    return (
      <>
        <div
          className="border border-border rounded-lg overflow-hidden h-[320px] cursor-pointer hover:border-primary/40 transition-colors w-[250px]"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="relative h-[200px]">
            <img
              src={promotion.imageUrl || "/game.webp"}
              alt={promotion.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {isModalOpen && (
          <Modal promotion={promotion} onClose={() => setIsModalOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="border border-border rounded-lg overflow-hidden h-[320px] cursor-pointer hover:border-primary/40 transition-colors w-[260px]"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative h-[200px]">
          <img
            src={promotion.imageUrl || "/game.webp"}
            alt={promotion.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 bg-card">
          <h3 className="text-primary font-bold text-lg mb-2">
            {promotion.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {promotion.description || "Exciting promotion offer"}
          </p>
          <Button className="bg-primary rounded-full w-full">
            Read More
          </Button>
        </div>
      </div>
      {isModalOpen && (
        <Modal promotion={promotion} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

function Modal({
  promotion,
  onClose,
}: {
  promotion: Promotion;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-primary">
            {promotion.title}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="relative h-64">
            <img
              src={promotion.imageUrl || "/game.webp"}
              alt={promotion.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <p className="mb-4 text-foreground">
              {promotion.description || "Exciting promotion offer"}
            </p>
            <div className="space-y-2 text-foreground">
              <p>
                <strong className="text-primary">Type:</strong> {promotion.type}
              </p>
              {promotion.value && (
                <p>
                  <strong className="text-primary">Value:</strong> {promotion.value}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
