"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface ChangeStatusModalUser {
  id: string;
  username: string;
  accountStatus?: boolean;
  betStatus?: boolean;
}

interface ChangeStatusModalProps {
  open: boolean;
  onClose: () => void;
  user: ChangeStatusModalUser | null;
  onConfirm: (data: {
    accountStatus: boolean;
    betStatus: boolean;
    currentUserPassword: string;
  }) => void;
  isLoading?: boolean;
}

export function ChangeStatusModal({
  open,
  onClose,
  user,
  onConfirm,
  isLoading = false,
}: ChangeStatusModalProps) {
  const [userActive, setUserActive] = useState(user?.accountStatus ?? true);
  const [betActive, setBetActive] = useState(user?.betStatus ?? true);
  const [transactionPassword, setTransactionPassword] = useState("");
  const [error, setError] = useState("");

  // Sync state when modal opens with user
  useEffect(() => {
    if (open && user) {
      setUserActive(user.accountStatus ?? true);
      setBetActive(user.betStatus ?? true);
      setTransactionPassword("");
      setError("");
    }
  }, [open, user]);

  const handleSubmit = () => {
    if (!transactionPassword.trim()) {
      setError("Transaction password is required");
      return;
    }
    setError("");
    onConfirm({
      accountStatus: userActive,
      betStatus: betActive,
      currentUserPassword: transactionPassword,
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Change Status
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-5">
          <p className="text-primary font-medium">{user.username}</p>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium text-foreground shrink-0">
              User Active
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {userActive ? "ON" : "OFF"}
              </span>
              <Switch
                checked={userActive}
                onCheckedChange={setUserActive}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium text-foreground shrink-0">
              Bet Active
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {betActive ? "ON" : "OFF"}
              </span>
              <Switch
                checked={betActive}
                onCheckedChange={setBetActive}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-password" className="text-sm font-medium text-foreground">
              Transaction Password
            </Label>
            <Input
              id="tx-password"
              type="password"
              value={transactionPassword}
              onChange={(e) => {
                setTransactionPassword(e.target.value);
                setError("");
              }}
              className={error ? "border-destructive" : ""}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              BACK
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-2 bg-primary text-primary-foreground"
            >
              {isLoading ? "..." : "submit"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
