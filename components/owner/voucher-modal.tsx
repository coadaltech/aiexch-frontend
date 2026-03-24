"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoucherModalProps } from "./types";
import { useOwnerUsers } from "@/hooks/useOwner";

export function VoucherModal({
  open,
  onClose,
  onSave,
  isLoading,
}: VoucherModalProps & { isLoading?: boolean }) {
  const { data: users = [], isLoading: usersLoading } = useOwnerUsers();
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    type: "limit",
    amount: "",
    method: "",
    reference: "",
    remarks: "",
    status: "approved",
  });
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        userId: "",
        type: "limit",
        amount: "",
        method: "",
        reference: "",
        remarks: "",
        status: "approved",
      });
      setError(null);
      setUserSearchOpen(false);
    }
  }, [open]);

  const validateForm = () => {
    if (!formData.userId) return "Please select a user";
    if (!formData.amount?.trim()) return "Amount is required";
    if (parseFloat(formData.amount) <= 0)
      return "Amount must be greater than 0";
    return null;
  };

  const handleSave = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const voucherData: any = {
      userId: formData.userId,
      type: formData.type,
      amount: formData.amount.toString(),
      status: formData.status,
    };

    if (formData.method) voucherData.method = formData.method;
    if (formData.reference) voucherData.reference = formData.reference;
    if (formData.remarks) voucherData.remarks = formData.remarks;

    onSave(voucherData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[95vh] overflow-y-auto max-w-3xl w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-foreground text-xl font-semibold">
            Create New Voucher
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Add a new voucher for a user
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="user-select" className="text-foreground font-medium text-sm">
                  Select User <span className="text-destructive">*</span>
                </Label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      disabled={usersLoading}
                      className="bg-input border text-foreground h-10 w-full justify-between font-normal"
                    >
                      {usersLoading
                        ? "Loading users..."
                        : formData.userId
                          ? (() => {
                              const selected = users.find((u: any) => u.id === formData.userId);
                              return selected ? `${selected.username} (${selected.email})` : "Select a user";
                            })()
                          : "Select a user"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by username or email..." />
                      <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
                        <CommandGroup>
                          {users.map((user: any) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.username} ${user.email}`}
                              onSelect={() => {
                                setFormData({ ...formData, userId: user.id });
                                setUserSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.userId === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{user.username} ({user.email})</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-select" className="text-foreground font-medium text-sm">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger
                    id="type-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="limit">Limit</SelectItem>
                    {/* <SelectItem value="credit">Credit</SelectItem> */}
                    {/* <SelectItem value="debit">Debit</SelectItem> */}
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdraw">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.type === "limit" && "Adds to user's credit limit"}
                  {formData.type === "credit" && "Adds to user's cash balance"}
                  {formData.type === "debit" && "Deducts from user's cash balance"}
                  {formData.type === "deposit" && "Adds to user's cash balance"}
                  {formData.type === "withdraw" && "Deducts from user's cash balance"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount-input" className="text-foreground font-medium text-sm">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="bg-input border text-foreground h-10 w-full"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="method-select" className="text-foreground font-medium text-sm">
                  Payment Method
                </Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, method: value })
                  }
                >
                  <SelectTrigger
                    id="method-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="admin_credits">Admin Credits</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference-input" className="text-foreground font-medium text-sm">
                  Reference
                </Label>
                <Input
                  id="reference-input"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  className="bg-input border text-foreground h-10 w-full"
                  placeholder="Transaction reference"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-select" className="text-foreground font-medium text-sm">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger
                    id="status-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="approved">Approved (Ledger updated immediately)</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks-input" className="text-foreground font-medium text-sm">
                  Remarks
                </Label>
                <Textarea
                  id="remarks-input"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  className="bg-input border text-foreground w-full min-h-[80px]"
                  placeholder="Optional remarks"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-foreground h-10 w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full sm:w-auto order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Voucher"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
