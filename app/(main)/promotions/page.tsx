import { NewPromotionCard } from "@/components/cards/new-promotion-card";
import { Gift } from "lucide-react";
import { getPromotions } from "@/lib/server-api";
import { Promotion } from "@/types";

export default async function PromotionsPage() {
  const response = await getPromotions();
  const promotions = response.data || [];
  return (
    <div className="min-h-screen  md:p-6">
      {/* Header */}
      <div className=" mb-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Promotions
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover amazing offers, bonuses, and rewards designed to boost your
            gaming experience
          </p>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="">
        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No promotions available
            </h3>
            <p className="text-muted-foreground">
              Check back later for exciting offers and bonuses
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              {/* <h2 className="text-2xl font-semibold text-foreground mb-4">
                Featured Promotions
              </h2> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {promotions.slice(0, 3).map((promotion: Promotion) => (
                  <NewPromotionCard
                    key={promotion.id}
                    promotion={promotion}
                    variant="featured"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
