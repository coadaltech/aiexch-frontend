import { uploadFile } from "@/lib/api";
import { TransactionConfirmationProps } from "@/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";

export default function TransactionConfirmation({
  isDeposit,
  method,
  amount,
  address,
  onConfirm,
  isLoading,
  withdrawalDetails,
}: TransactionConfirmationProps & {
  isLoading?: boolean;
  withdrawalDetails?: Record<string, string>;
}) {
  const methodName = method?.name || "";

  const USD_TO_INR = 83.5;
  const inrAmount = (parseFloat(amount) * USD_TO_INR).toFixed(2);
  const [imageData, setImageData] = useState<File | null>(null);
  // const [imagePreview, setImagePreview] = useState<string | null>(null);

  // useEffect(() => {
  //   if (!(imageData instanceof File)) return;

  //   const blob = URL.createObjectURL(imageData);
  //   setImagePreview(blob);
  //   return () => {
  //     URL.revokeObjectURL(blob);
  //     setImagePreview("");
  //   };
  // }, [imageData]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Confirm {isDeposit ? "Deposit" : "Withdrawal"}
        </h3>
        <p className="text-gray-500 text-sm">
          Please review your transaction details
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex justify-between">
          <span className="text-gray-500">Method:</span>
          <span className="text-gray-900 font-semibold">{methodName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount:</span>
          <div className="text-right">
            {method?.method?.currency === "INR" ||
            method?.qrCode?.currency === "INR" ? (
              <div className="text-gray-900 font-semibold">₹{amount} INR</div>
            ) : (
              <>
                <div className="text-gray-900 font-semibold">
                  ₹{inrAmount} INR
                </div>
                <div className="text-gray-500 text-sm">
                  ${amount} USD
                </div>
              </>
            )}
          </div>
        </div>
        {!isDeposit && (address || withdrawalDetails) && (
          <div className="space-y-2">
            {withdrawalDetails?.accountName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Account Name:</span>
                <span className="text-gray-900 text-sm">
                  {withdrawalDetails.accountName}
                </span>
              </div>
            )}
            {withdrawalDetails?.accountNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Account Number:</span>
                <span className="text-gray-900 font-mono text-sm">
                  {withdrawalDetails.accountNumber}
                </span>
              </div>
            )}
            {withdrawalDetails?.ifscCode && (
              <div className="flex justify-between">
                <span className="text-gray-500">IFSC Code:</span>
                <span className="text-gray-900 text-sm">
                  {withdrawalDetails.ifscCode}
                </span>
              </div>
            )}
            {withdrawalDetails?.bankName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Bank Name:</span>
                <span className="text-gray-900 text-sm">
                  {withdrawalDetails.bankName}
                </span>
              </div>
            )}
            {withdrawalDetails?.mobileNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mobile Number:</span>
                <span className="text-gray-900 text-sm">
                  {withdrawalDetails.mobileNumber}
                </span>
              </div>
            )}
            {address && (
              <div className="flex justify-between">
                <span className="text-gray-500">Address:</span>
                <span className="text-gray-900 font-mono text-sm break-all">
                  {address}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isDeposit && (
        <div>
          <Label className="mb-2 text-gray-700">Upload Payment Proof *</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImageData(e.target.files?.[0] || null)}
            required
            className="bg-white text-gray-900"
          />
          {!imageData && (
            <p className="text-xs text-gray-500 mt-1">
              Please upload payment proof to continue
            </p>
          )}
        </div>
      )}

      <Button
        onClick={() => onConfirm(imageData as File)}
        isLoading={isLoading}
        disabled={isDeposit && !imageData}
        className="w-full bg-[var(--header-primary)] text-white hover:bg-[var(--header-primary)]/90"
      >
        {isDeposit ? "I've Sent the Payment" : "Confirm Withdrawal"}
      </Button>
    </div>
  );
}
