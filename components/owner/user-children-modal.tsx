"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserDownline } from "@/hooks/useOwner";
import { Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserChildrenModalProps {
  open: boolean;
  onClose: () => void;
  user: { id: string; username: string } | null;
}

type Crumb = { id: string; username: string };

function fmt(n: any) {
  const v = parseFloat(n ?? 0);
  if (isNaN(v)) return "0";
  return v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function roleLabel(role: string | number | undefined): string {
  const r = String(role ?? "").toLowerCase();
  switch (r) {
    case "0": case "owner":   return "Owner";
    case "3": case "admin":   return "Admin";
    case "4": case "super":   return "Super Master";
    case "5": case "master":  return "Master";
    case "6": case "agent":   return "Agent";
    case "7": case "user":    return "User";
    default: return role ? String(role) : "—";
  }
}

function StatusDot({ active, title }: { active: boolean; title?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded text-white text-[11px] font-bold",
        active ? "bg-green-600" : "bg-rose-600",
      )}
      title={title ?? (active ? "Active" : "Disabled")}
    >
      {active ? "✓" : "✕"}
    </span>
  );
}

export function UserChildrenModal({
  open,
  onClose,
  user,
}: UserChildrenModalProps) {
  // Breadcrumb stack of users we've drilled into. The last entry is the user
  // whose children we're currently displaying. Reset when the modal closes
  // so reopening on a different user starts fresh.
  const [stack, setStack] = useState<Crumb[]>([]);

  useEffect(() => {
    if (open && user) {
      setStack([{ id: user.id, username: user.username }]);
    } else if (!open) {
      setStack([]);
    }
  }, [open, user]);

  const current = stack[stack.length - 1] ?? null;
  const { data: children = [], isLoading } = useUserDownline(current?.id ?? null);

  const drillInto = (u: { id: string; username: string }) => {
    setStack((prev) => [...prev, u]);
  };

  const popTo = (index: number) => {
    setStack((prev) => prev.slice(0, index + 1));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border max-w-6xl max-h-[88vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 py-3 sm:px-5 sm:py-3 border-b border-border">
          <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
            Downline
          </DialogTitle>
          {/* Breadcrumb — each segment pops back to that level. The last
              segment is the user we're currently viewing. */}
          <div className="flex items-center flex-wrap gap-1 mt-1 text-xs sm:text-sm">
            {stack.map((c, i) => {
              const isLast = i === stack.length - 1;
              return (
                <span key={`${c.id}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  {isLast ? (
                    <span className="font-semibold text-primary">{c.username}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => popTo(i)}
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      {c.username}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : children.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">
              No users created by this user.
            </p>
          ) : (
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-[12px] font-bold uppercase tracking-wide border-b border-gray-200 sticky top-0">
                  <th className="px-3 py-2 text-left">User Name</th>
                  <th className="px-3 py-2 text-right">Credit Reference</th>
                  <th className="px-3 py-2 text-right">Client (P/L)</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2 text-right">Exposure</th>
                  <th className="px-3 py-2 text-right">Available Balance</th>
                  <th className="px-3 py-2 text-center">U st</th>
                  <th className="px-3 py-2 text-center">B st</th>
                  <th className="px-3 py-2 text-right">Transaction Limit</th>
                  <th className="px-3 py-2 text-left">Account Type</th>
                </tr>
              </thead>
              <tbody>
                {children.map((u: any) => {
                  const fixLimit         = u.fixLimit         ?? "0";
                  const finalLimit       = u.finalLimit       ?? "0";
                  const limitConsumed    = u.limitConsumed    ?? "0";
                  const userBalance      = u.balance          ?? u.userBalance ?? "0";
                  const transactionLimit = u.transactionLimit ?? "0";

                  const fixLimitNum = parseFloat(fixLimit);
                  const clientPnl = parseFloat(finalLimit) - fixLimitNum;
                  const computedBalance = fixLimitNum - clientPnl;

                  const uActive = u.accountStatus !== false && u.parentAccountStatus !== false;
                  const bActive = u.betStatus     !== false && u.parentBetStatus     !== false;

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <button
                          onClick={() => drillInto({ id: u.id, username: u.username })}
                          className="font-semibold text-[var(--header-primary)] hover:underline text-left"
                          title="View this user's downline"
                        >
                          {u.username}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {fmt(fixLimit)}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-semibold whitespace-nowrap",
                          clientPnl > 0
                            ? "text-emerald-600"
                            : clientPnl < 0
                              ? "text-rose-600"
                              : "text-gray-800",
                        )}
                        title={clientPnl < 0 ? "Loss" : clientPnl > 0 ? "Profit" : "Breakeven"}
                      >
                        {clientPnl > 0 ? "+" : ""}{fmt(clientPnl)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {fmt(computedBalance)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {fmt(limitConsumed)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {fmt(userBalance)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <StatusDot
                          active={uActive}
                          title={uActive ? "User active" : "User disabled"}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <StatusDot
                          active={bActive}
                          title={bActive ? "Betting active" : "Betting disabled"}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {fmt(transactionLimit)}
                      </td>
                      <td className="px-3 py-2 text-left text-gray-800 whitespace-nowrap">
                        {roleLabel(u.role)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
