"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, ArrowLeft } from "lucide-react";
import { TransactionModalProps, MethodSelectionProps } from "@/types";
import { userApi, publicApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DepositDetails } from "./deposit-details";
import { WithdrawalDetails } from "./withdrawal-details";
import TransactionConfirmation from "./transaction-confirmation";

export default function TransactionModal({
  isOpen,
  onClose,
  type,
}: TransactionModalProps) {
  const [step, setStep] = useState<"method" | "details" | "confirmation">(
    "method"
  );
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [withdrawalDetails, setWithdrawalDetails] = useState<
    Record<string, string>
  >({});
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: (data: {
      amount: string;
      method: string;
      reference?: string;
      proofImage: File;
    }) => userApi.createDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Deposit request submitted successfully!");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit deposit");
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: (data: {
      amount: string;
      method: string;
      address: string;
      withdrawalAddress?: string;
    }) => userApi.createWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      toast.success("Withdrawal request submitted successfully!");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit withdrawal"
      );
    },
  });

  const resetModal = () => {
    setStep("method");
    setSelectedMethod(null);
    setAmount("");
    setAddress("");
    setWithdrawalDetails({});
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const isDeposit = type === "deposit";
  const title = isDeposit ? "Deposit" : "Withdraw";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto bg-white"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "method" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={() =>
                  setStep(step === "confirmation" ? "details" : "method")
                }
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <DialogTitle className="text-xl font-bold text-gray-900">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="pt-4">
          {step === "method" && (
            <MethodSelection
              isDeposit={isDeposit}
              selectedMethod={selectedMethod}
              onMethodSelect={(method) => {
                setSelectedMethod(method);
                setStep("details");
              }}
            />
          )}

          {step === "details" &&
            (isDeposit ? (
              <DepositDetails
                method={selectedMethod}
                amount={amount}
                onAmountChange={setAmount}
                onNext={() => setStep("confirmation")}
              />
            ) : (
              <WithdrawalDetails
                method={selectedMethod}
                amount={amount}
                address={address}
                onAmountChange={setAmount}
                onAddressChange={setAddress}
                withdrawalDetails={withdrawalDetails}
                onWithdrawalDetailsChange={setWithdrawalDetails}
                onNext={() => setStep("confirmation")}
              />
            ))}

          {step === "confirmation" && (
            <TransactionConfirmation
              isDeposit={isDeposit}
              method={selectedMethod}
              amount={amount}
              address={address}
              withdrawalDetails={withdrawalDetails}
              onConfirm={(proofImage: File) => {
                if (isDeposit) {
                  depositMutation.mutate({
                    amount,
                    method: selectedMethod?.name || "",
                    reference: selectedMethod?.qrCode?.walletAddress,
                    proofImage,
                  });
                } else {
                  withdrawalMutation.mutate({
                    amount,
                    method: selectedMethod?.name || "",
                    address: address || JSON.stringify(withdrawalDetails),
                    withdrawalAddress: address,
                  });
                }
              }}
              isLoading={
                depositMutation.isPending || withdrawalMutation.isPending
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MethodSelection({
  isDeposit,
  selectedMethod,
  onMethodSelect,
}: MethodSelectionProps) {
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDeposit) {
      publicApi
        .getQrCodes()
        .then((response) => {
          setQrCodes(response.data.data || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      publicApi
        .getWithdrawalMethods()
        .then((response) => {
          setWithdrawalMethods(
            response.data.data?.filter(
              (method: any) => method.status === "active"
            ) || []
          );
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isDeposit]);

  const depositMethods = qrCodes.map((qr) => ({
    id: qr.paymentMethod.toLowerCase().replace(/\s+/g, "-"),
    name: qr.paymentMethod,
    icon: qr.paymentMethod.charAt(0),
    description: qr.instructions || `Pay with ${qr.paymentMethod}`,
    qrCode: qr,
  }));

  const withdrawMethods = withdrawalMethods.map((method) => ({
    id: method.name.toLowerCase().replace(/\s+/g, "-"),
    name: method.name,
    icon: method.type === "crypto" ? "₿" : <Building2 className="w-6 h-6" />,
    description:
      method.instructions ||
      `${method.processingTime} • Fee: ${method.feePercentage}% + ${method.feeFixed}`,
    method: method,
  }));

  const methods = isDeposit ? depositMethods : withdrawMethods;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--header-primary)] mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose {isDeposit ? "Deposit" : "Withdrawal"} Method
        </h3>
        <p className="text-gray-500 text-sm">
          Select your preferred {isDeposit ? "deposit" : "withdrawal"} method
        </p>
      </div>

      <div className="space-y-3">
        {methods.map((method) => (
          <div
            key={method.id}
            onClick={() => onMethodSelect(method)}
            className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--header-primary)] hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--header-primary)]/10 text-lg font-bold text-[var(--header-primary)]">
                {typeof method.icon === "string" ? method.icon : method.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900">
                    {method.name}
                  </div>
                  {"qrCode" in method && method.qrCode?.currency && (
                    <span className="rounded bg-[var(--header-primary)]/10 px-2 py-1 text-xs text-[var(--header-primary)]">
                      {method.qrCode.currency}
                    </span>
                  )}
                  {"method" in method && method.method?.currency && (
                    <span className="rounded bg-[var(--header-primary)]/10 px-2 py-1 text-xs text-[var(--header-primary)]">
                      {method.method.currency}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {method.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
