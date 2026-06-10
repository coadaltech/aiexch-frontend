"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Label } from "../ui/label";

export function DepositDetails({
  method,
  amount,
  onAmountChange,
  onNext,
}: {
  method: any;
  amount: string;
  onAmountChange: (amount: string) => void;
  onNext: () => void;
}) {
  const methodName = method?.name || "";
  const qrCode = method?.qrCode;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">
          Deposit {methodName}
        </h3>
      </div>

      {qrCode && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
          <div className="mb-4 text-center">
            {qrCode.qrCodeUrl ? (
              <Image
                src={qrCode.qrCodeUrl}
                alt="QR Code"
                height={256}
                width={256}
                className="mx-auto mb-3 h-48 w-48 rounded-lg sm:h-64 sm:w-64"
                loading="eager"
              />
            ) : (
              <div className="mx-auto mb-3 flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100 sm:h-64 sm:w-64">
                <QrCode className="h-40 w-40 text-gray-900 sm:h-56 sm:w-56" />
              </div>
            )}
            <p className="text-xs text-gray-500 sm:text-sm">
              Scan QR code or copy address below
            </p>
          </div>

          {qrCode.walletAddress && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="break-all font-mono text-xs text-gray-900 sm:text-sm">
                  {qrCode.walletAddress}
                </span>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(qrCode.walletAddress);
                    toast.success("Address copied to clipboard!");
                  }}
                  className="shrink-0 p-2 text-[var(--header-primary)] hover:text-[var(--header-primary)]/80"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {qrCode.instructions && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2 sm:mt-4 sm:p-3">
              <p className="text-xs text-gray-500">{qrCode.instructions}</p>
            </div>
          )}

          <div className="mt-3 space-y-2 sm:mt-4">
            <Label className="text-sm text-gray-700">Enter Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="bg-white text-sm text-gray-900"
            />
            <div className="flex flex-wrap gap-2">
              {[100, 500, 1000, 5000, 10000].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAmountChange(preset.toString())}
                  className="min-w-[60px] flex-1 border-gray-300 bg-white text-xs text-gray-800 hover:bg-gray-100 sm:text-sm"
                >
                  ₹{preset}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={!amount}
        className="w-full bg-[var(--header-primary)] text-white hover:bg-[var(--header-primary)]/90"
      >
        Confirm Deposit
      </Button>
    </div>
  );
}
