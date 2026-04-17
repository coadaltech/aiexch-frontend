"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Percent } from "lucide-react";
import { useUpdateUser } from "@/hooks/useOwner";

type CommissionUser = {
  id: string;
  username: string;
  role?: string | number | null;
  upline?: string | number | null;
  downline?: string | number | null;
};

export function CommissionModal({
  open,
  onClose,
  user,
  canEditUpline = false,
}: {
  open: boolean;
  onClose: () => void;
  user: CommissionUser | null;
  /** True only when the operator is the Owner — only the Owner may edit upline. */
  canEditUpline?: boolean;
}) {
  const updateMutation = useUpdateUser();
  const [upline, setUpline] = useState("0");
  const [downline, setDownline] = useState("0");
  const [error, setError] = useState<string | null>(null);

  // For role="user" both sides are locked at 100%.
  const isEndUser = String(user?.role ?? "").toLowerCase() === "user" ||
                    String(user?.role ?? "") === "7";
  const uplineLocked   = isEndUser || !canEditUpline;
  const downlineLocked = isEndUser;

  useEffect(() => {
    if (open && user) {
      if (isEndUser) {
        setUpline("100");
        setDownline("100");
      } else {
        setUpline(String(user.upline ?? "0"));
        setDownline(String(user.downline ?? "0"));
      }
      setError(null);
    }
  }, [open, user, isEndUser]);

  const validate = (): string | null => {
    const u = parseFloat(upline);
    const d = parseFloat(downline);
    if (isNaN(u) || isNaN(d)) return "Upline and downline must be numbers";
    if (u < 0 || u > 100) return "Upline must be between 0 and 100";
    if (d < 0 || d > 100) return "Downline must be between 0 and 100";
    return null;
  };

  const handleSave = () => {
    if (!user?.id) return;
    const msg = validate();
    if (msg) { setError(msg); return; }
    setError(null);

    // Only send the fields the operator is actually allowed to change.
    const body: any = { id: user.id };
    if (!downlineLocked) body.downline = parseFloat(downline).toFixed(2);
    if (!uplineLocked)   body.upline   = parseFloat(upline).toFixed(2);

    if (Object.keys(body).length === 1) {
      // Nothing to change (all fields locked for this operator).
      onClose();
      return;
    }

    updateMutation.mutate(body, { onSuccess: () => onClose() });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border max-w-md w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-foreground text-xl font-semibold flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Commission
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            {user ? (
              <>
                Update upline & downline for{" "}
                <span className="font-semibold text-foreground">{user.username}</span>.
              </>
            ) : "Update commission percentages."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
          )}
          {isEndUser && (
            <div className="p-3 rounded-md bg-muted/50 text-muted-foreground text-xs">
              End users always receive 100% on both upline and downline. These values cannot be changed.
            </div>
          )}
          {!isEndUser && !canEditUpline && (
            <div className="p-3 rounded-md bg-muted/50 text-muted-foreground text-xs">
              Only the Owner can change the upline percentage. You can update the downline below.
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-foreground font-medium text-sm">
              Upline (%){uplineLocked && <span className="ml-1 text-[10px] text-muted-foreground">(locked)</span>}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={upline}
              onChange={(e) => setUpline(e.target.value)}
              disabled={uplineLocked}
              className="bg-input border text-foreground h-10 w-full disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-medium text-sm">
              Downline (%){downlineLocked && <span className="ml-1 text-[10px] text-muted-foreground">(locked)</span>}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={downline}
              onChange={(e) => setDownline(e.target.value)}
              disabled={downlineLocked}
              className="bg-input border text-foreground h-10 w-full disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="text-foreground h-10 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || (uplineLocked && downlineLocked)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full sm:w-auto"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : "Save Commission"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
