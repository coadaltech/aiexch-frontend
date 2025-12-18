"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Gift, Star } from "lucide-react";
import { useEffect, useState } from "react";

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => {
    setIsOpen(false);
  };



  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000); // Show after 2 seconds
    return () => clearTimeout(timer);
  }, []);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-casino-dark border-casino-primary max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-casino-primary-text text-lg font-semibold mb-2">
              🎉 Welcome Bonus Available!
            </h3>
            <p className="text-casino-secondary-text text-sm">
              Claim your daily bonus and start winning big today!
            </p>
          </div>

          {/* Bonus cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-casino-darker border border-casino-primary/30 rounded-lg p-3 text-center">
              <Gift className="w-6 h-6 text-casino-primary mx-auto mb-2" />
              <div className="text-casino-primary-text font-bold text-sm">
                Daily Bonus
              </div>
              <div className="text-casino-primary text-xs">+100 Coins</div>
            </div>
            <div className="bg-casino-darker border border-casino-primary/30 rounded-lg p-3 text-center">
              <Star className="w-6 h-6 text-casino-accent mx-auto mb-2" />
              <div className="text-casino-primary-text font-bold text-sm">
                Free Spins
              </div>
              <div className="text-casino-accent text-xs">x10 Spins</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={onClose}
              className="w-full bg-casino-primary hover:bg-casino-primary-dark text-casino-inverse font-semibold h-12"
            >
              Claim Bonus & Start Playing
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full border-casino-primary/30 text-casino-secondary-text hover:text-casino-primary-text hover:bg-casino-dark bg-transparent"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
