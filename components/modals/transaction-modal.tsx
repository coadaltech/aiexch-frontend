"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        className="max-w-md max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step !== "method" && (
              <Button
                onClick={() =>
                  setStep(step === "confirmation" ? "details" : "method")
                }
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <DialogTitle className="text-xl font-bold text-foreground">
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Choose {isDeposit ? "Deposit" : "Withdrawal"} Method
        </h3>
        <p className="text-muted-foreground text-sm">
          Select your preferred {isDeposit ? "deposit" : "withdrawal"} method
        </p>
      </div>

      <div className="space-y-3">
        {methods.map((method) => (
          <Card
            key={method.id}
            onClick={() => onMethodSelect(method)}
            className="w-full p-4 cursor-pointer hover:bg-card/80 hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center text-primary font-bold text-lg">
                {typeof method.icon === "string" ? method.icon : method.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-foreground">
                    {method.name}
                  </div>
                  {"qrCode" in method && method.qrCode?.currency && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      {method.qrCode.currency}
                    </span>
                  )}
                  {"method" in method && method.method?.currency && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      {method.method.currency}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {method.description}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
