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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateQrCode, useUpdateQrCode } from "@/hooks/useAdmin";
import { uploadFile } from "@/lib/api";
import { FileUpload } from "@/components/ui/file-upload";
import { QrCodeModalProps } from "./types";

export function QrCodeModal({ open, onClose, qrCode }: QrCodeModalProps) {
  const [formData, setFormData] = useState({
    paymentMethod: "",
    currency: "INR",
    qrCodeUrl: "",
    walletAddress: "",
    instructions: "",
    status: "active",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createMutation = useCreateQrCode();
  const updateMutation = useUpdateQrCode();

  useEffect(() => {
    if (qrCode) {
      setFormData({
        paymentMethod: qrCode.paymentMethod || "",
        currency: qrCode.currency || "INR",
        qrCodeUrl: qrCode.qrCodeUrl || "",
        walletAddress: qrCode.walletAddress || "",
        instructions: qrCode.instructions || "",
        status: qrCode.status || "active",
      });
    } else {
      setFormData({
        paymentMethod: "",
        currency: "INR",
        qrCodeUrl: "",
        walletAddress: "",
        instructions: "",
        status: "active",
      });
    }
    setSelectedFile(null);
  }, [qrCode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const form = new FormData();

      form.append("paymentMethod", formData.paymentMethod);
      form.append("currency", formData.currency);
      form.append("walletAddress", formData.walletAddress);
      form.append("instructions", formData.instructions);
      form.append("status", formData.status);

      // Append file if selected
      if (selectedFile) {
        form.append("qrCodeUrl", selectedFile);
      } else if (qrCode?.qrCodeUrl) {
        form.append("qrCodeUrl", formData.qrCodeUrl);
      }

      if (qrCode) {
        // Update existing QR Code
        await updateMutation.mutateAsync({ id: qrCode.id, body: form });
      } else {
        // Create new QR Code
        await createMutation.mutateAsync(form);
      }

      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border ">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {qrCode ? "Edit QR Code" : "Add QR Code"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, paymentMethod: value }))
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 mt-2">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                <SelectItem value="Bitcoin">Bitcoin (BTC)</SelectItem>
                <SelectItem value="Ethereum">Ethereum (ETH)</SelectItem>
                <SelectItem value="USDT">Tether (USDT)</SelectItem>
                <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                <SelectItem value="Binance Coin">Binance Coin (BNB)</SelectItem>
                <SelectItem value="Litecoin">Litecoin (LTC)</SelectItem>
                <SelectItem value="Dogecoin">Dogecoin (DOGE)</SelectItem>
                <SelectItem value="PayPal">PayPal</SelectItem>
                <SelectItem value="Skrill">Skrill</SelectItem>
                <SelectItem value="Neteller">Neteller</SelectItem>
                <SelectItem value="Perfect Money">Perfect Money</SelectItem>
                <SelectItem value="WebMoney">WebMoney</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Paytm">Paytm</SelectItem>
                <SelectItem value="PhonePe">PhonePe</SelectItem>
                <SelectItem value="Google Pay">Google Pay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, currency: value }))
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 mt-2">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">QR Code Image</Label>
            <FileUpload
              onFileSelect={setSelectedFile}
              currentImageUrl={formData.qrCodeUrl}
              accept="image/*"
              maxSize={5}
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Wallet Address</Label>
            <Input
              value={formData.walletAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  walletAddress: e.target.value,
                }))
              }
              className="bg-casino-darker border-casino-primary/30 mt-2"
              placeholder="Wallet address or payment details"
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Instructions</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              className="bg-casino-darker border-casino-primary/30 mt-2"
              placeholder="Payment instructions for users"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-casino-primary/30 text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {qrCode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
