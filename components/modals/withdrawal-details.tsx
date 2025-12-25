"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "../ui/label";

export function WithdrawalDetails({
  method,
  amount,
  address,
  onAmountChange,
  onAddressChange,
  onNext,
  withdrawalDetails,
  onWithdrawalDetailsChange,
}: {
  method: any;
  amount: string;
  address: string;
  onAmountChange: (amount: string) => void;
  onAddressChange: (address: string) => void;
  onNext: () => void;
  withdrawalDetails?: Record<string, string>;
  onWithdrawalDetailsChange?: (details: Record<string, string>) => void;
}) {
  const methodName = method?.name || "";
  const withdrawalMethod = method?.method;

  const USD_TO_INR = 83.5;
  const getConvertedAmount = (usdAmount: string) => {
    const usd = parseFloat(usdAmount) || 0;
    return (usd * USD_TO_INR).toFixed(2);
  };

  const calculateFee = (amount: string) => {
    if (!withdrawalMethod) return 0;
    const amt = parseFloat(amount) || 0;
    const feePercentage = parseFloat(withdrawalMethod.feePercentage) || 0;
    const feeFixed = parseFloat(withdrawalMethod.feeFixed) || 0;
    return (amt * feePercentage) / 100 + feeFixed;
  };

  const fee = calculateFee(amount);
  const netAmount = parseFloat(amount) - fee;

  const isWithdrawalFormValid = () => {
    if (withdrawalMethod?.type === "bank") {
      return (
        withdrawalDetails?.accountName &&
        withdrawalDetails?.accountNumber &&
        withdrawalDetails?.ifscCode &&
        withdrawalDetails?.bankName
      );
    }
    if (withdrawalMethod?.type === "ewallet") {
      return address && withdrawalDetails?.mobileNumber;
    }
    return address;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Withdraw {methodName}
        </h3>
      </div>

      <div>
        <Label className="mb-2">
          Amount ({withdrawalMethod?.currency || "USD"})
        </Label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
        />
        {withdrawalMethod && amount && (
          <div className="mt-1 text-xs text-muted-foreground">
            Limits: {withdrawalMethod.minAmount} - {withdrawalMethod.maxAmount}{" "}
            {withdrawalMethod.currency}
            {(parseFloat(amount) < parseFloat(withdrawalMethod.minAmount) ||
              parseFloat(amount) > parseFloat(withdrawalMethod.maxAmount)) && (
              <span className="text-destructive block">
                Amount must be between {withdrawalMethod.minAmount} and{" "}
                {withdrawalMethod.maxAmount}
              </span>
            )}
          </div>
        )}
        {amount && parseFloat(amount) > 0 && (
          <div className="mt-2 space-y-2">
            {withdrawalMethod?.currency !== "INR" && (
              <Card className="p-3">
                <p className="text-sm text-foreground">
                  Equivalent: ₹{getConvertedAmount(amount)} INR
                </p>
              </Card>
            )}
            {withdrawalMethod &&
              parseFloat(amount) >= parseFloat(withdrawalMethod.minAmount) &&
              parseFloat(amount) <= parseFloat(withdrawalMethod.maxAmount) && (
                <Card className="p-3">
                  <div className="flex justify-between text-foreground">
                    <span>Amount:</span>
                    <span>
                      {withdrawalMethod.currency} {amount}
                    </span>
                  </div>
                  {fee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fee:</span>
                      <span>
                        {withdrawalMethod.currency} {fee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-primary border-t border-border pt-2 mt-2">
                    <span>You'll receive:</span>
                    <span>
                      {withdrawalMethod.currency} {netAmount.toFixed(2)}
                    </span>
                  </div>
                </Card>
              )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {withdrawalMethod?.type === "bank" ? (
          <>
            <div>
              <Label className="mb-2">Account Holder Name</Label>
              <Input
                type="text"
                placeholder="Enter account holder name"
                value={withdrawalDetails?.accountName || ""}
                onChange={(e) =>
                  onWithdrawalDetailsChange?.({
                    ...withdrawalDetails,
                    accountName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-2">Account Number</Label>
              <Input
                type="text"
                placeholder="Enter account number"
                value={withdrawalDetails?.accountNumber || ""}
                onChange={(e) =>
                  onWithdrawalDetailsChange?.({
                    ...withdrawalDetails,
                    accountNumber: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-2">IFSC Code</Label>
              <Input
                type="text"
                placeholder="Enter IFSC code"
                value={withdrawalDetails?.ifscCode || ""}
                onChange={(e) =>
                  onWithdrawalDetailsChange?.({
                    ...withdrawalDetails,
                    ifscCode: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-2">Bank Name</Label>
              <Input
                type="text"
                placeholder="Enter bank name"
                value={withdrawalDetails?.bankName || ""}
                onChange={(e) =>
                  onWithdrawalDetailsChange?.({
                    ...withdrawalDetails,
                    bankName: e.target.value,
                  })
                }
              />
            </div>
          </>
        ) : withdrawalMethod?.type === "ewallet" ? (
          <>
            <div>
              <Label className="mb-2">{methodName} ID/Number</Label>
              <Input
                type="text"
                placeholder={`Enter your ${methodName} ID`}
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2">Registered Mobile Number</Label>
              <Input
                type="text"
                placeholder="Enter registered mobile number"
                value={withdrawalDetails?.mobileNumber || ""}
                onChange={(e) =>
                  onWithdrawalDetailsChange?.({
                    ...withdrawalDetails,
                    mobileNumber: e.target.value,
                  })
                }
              />
            </div>
          </>
        ) : (
          <div>
            <Label className="mb-2">{methodName} Address</Label>
            <Input
              type="text"
              placeholder={`Enter your ${methodName} address`}
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
            />
          </div>
        )}
        {withdrawalMethod?.instructions && (
          <Card className="mt-2 p-2">
            <p className="text-xs text-muted-foreground">
              {withdrawalMethod.instructions}
            </p>
          </Card>
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={
          !amount ||
          !isWithdrawalFormValid() ||
          (withdrawalMethod &&
            (parseFloat(amount) < parseFloat(withdrawalMethod.minAmount) ||
              parseFloat(amount) > parseFloat(withdrawalMethod.maxAmount)))
        }
        className="w-full"
      >
        Continue
      </Button>
      {withdrawalMethod && (
        <p className="text-xs mt-2 text-center text-muted-foreground">
          Processing time: {withdrawalMethod.processingTime}
        </p>
      )}
    </div>
  );
}
