"use client";

import { useState } from "react";
import { X, Gift, Clock, Star } from "lucide-react";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { Promotion } from "@/types";

interface NewPromotionCardProps {
  promotion: Promotion;
  variant?: "default" | "featured" | "compact";
}

const getActionIcon = (type?: string) => {
  const lowerType = type?.toLowerCase();
  switch (lowerType) {
    case "deposit":
    case "deposit bonus":
      return <Gift className="w-4 h-4" />;
    case "free_spins":
    case "free spins":
      return <Star className="w-4 h-4" />;
    case "cashback":
      return <Clock className="w-4 h-4" />;
    default:
      return <Gift className="w-4 h-4" />;
  }
};

const getActionColor = (type?: string) => {
  const lowerType = type?.toLowerCase();
  switch (lowerType) {
    case "deposit":
    case "deposit bonus":
      return "bg-green-600";
    case "free_spins":
    case "free spins":
      return "bg-blue-600";
    case "cashback":
      return "bg-purple-600";
    case "no_deposit":
    case "no deposit":
      return "bg-orange-600";
    default:
      return "bg-primary";
  }
};

const getTypeLabel = (type?: string) => {
  if (!type) return "PROMO";
  return type.replace("_", " ").toUpperCase();
};

export function NewPromotionCard({
  promotion,
  variant = "default",
}: NewPromotionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === "compact") {
    return (
      <>
        <div
          className="group relative overflow-hidden rounded-md bg-card/40 backdrop-blur-2xl border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer w-[280px] h-[200px] flex-shrink-0"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="absolute inset-0">
            <Image
              src={promotion.imageUrl || "/game.webp"}
              alt={promotion.title}
              height={1200}
              width={1200}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          </div>

          <div className="relative h-full flex flex-col justify-end p-4">
            <Badge
              className={`${getActionColor(
                promotion.type
              )} text-white w-fit mb-2`}
            >
              {getActionIcon(promotion.type)}
              <span className="ml-1 text-xs">
                {getTypeLabel(promotion.type)}
              </span>
            </Badge>
            <h3 className="text-primary font-bold text-lg mb-1 line-clamp-2">
              {promotion.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-1">
              {promotion.description || "Exciting promotion offer"}
            </p>
          </div>
        </div>
        {isModalOpen && (
          <PromotionModal
            promotion={promotion}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  if (variant === "featured") {
    return (
      <>
        <div
          className="group relative overflow-hidden rounded-md bg-card/40 backdrop-blur-2xl border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer w-full h-[320px] sm:h-[400px]"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="absolute inset-0">
            <Image
              src={promotion.imageUrl || "/game.webp"}
              alt={promotion.title}
              height={1200}
              width={1200}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          </div>

          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground">
              <Star className="w-3 h-3 mr-1" />
              FEATURED
            </Badge>
          </div>

          <div className="relative h-full flex flex-col justify-end p-6">
            <Badge
              className={`${getActionColor(
                promotion.type
              )} text-white w-fit mb-3`}
            >
              {getActionIcon(promotion.type)}
              <span className="ml-1">{getTypeLabel(promotion.type)}</span>
            </Badge>
            <h3 className="text-primary font-bold text-2xl mb-3 line-clamp-2">
              {promotion.title}
            </h3>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {promotion.description || "Exciting promotion offer"}
            </p>
          </div>
        </div>
        {isModalOpen && (
          <PromotionModal
            promotion={promotion}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-md bg-card/40 backdrop-blur-2xl border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer w-full h-[300px] sm:h-[350px] hover:-translate-y-1"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative h-[200px] overflow-hidden">
          <Image
            src={promotion.imageUrl || "/game.webp"}
            alt={promotion.title}
            height={1200}
            width={1200}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Badge className={`${getActionColor(promotion.type)} text-white`}>
              {getActionIcon(promotion.type)}
              <span className="ml-1 text-xs">
                {getTypeLabel(promotion.type)}
              </span>
            </Badge>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-primary font-bold text-xl mb-3 line-clamp-2">
            {promotion.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {promotion.description || "Exciting promotion offer"}
          </p>
        </div>
      </div>
      {isModalOpen && (
        <PromotionModal
          promotion={promotion}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

function PromotionModal({
  promotion,
  onClose,
}: {
  promotion: Promotion;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card/40 backdrop-blur-2xl rounded-md max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-primary">{promotion.title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="relative h-64">
            <Image
              src={promotion.imageUrl || "/game.webp"}
              alt={promotion.title}
              height={1200}
              width={1200}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={`${getActionColor(promotion.type)} text-white`}>
                {getActionIcon(promotion.type)}
                <span className="ml-1">{getTypeLabel(promotion.type)}</span>
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                Description
              </h3>
              <p className="text-foreground">
                {promotion.description || "Exciting promotion offer"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
