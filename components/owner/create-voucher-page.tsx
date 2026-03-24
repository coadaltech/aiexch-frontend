"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Loader2,
  ChevronsUpDown,
  Check,
  ArrowLeft,
  User,
  DollarSign,
  CreditCard,
  FileText,
  Shield,
  Wallet,
  List,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOwnerUsers, useCreateVoucher, useVouchers, useUpdateVoucher } from "@/hooks/useOwner";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/owner/skeletons";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/pagination";
import { useModal } from "@/hooks/useModal";
import { VoucherEditModal } from "@/components/owner/voucher-edit-modal";

const TYPE_CONFIG: Record<
  string,
  { label: string; description: string; badgeColor: string; icon: React.ElementType }
> = {
  limit: {
    label: "Limit Voucher",
    description: "Adds to user's credit limit. The user will be able to place bets up to this limit.",
    badgeColor: "bg-indigo-600",
    icon: Shield,
  },
  deposit: {
    label: "Deposit Voucher",
    description: "Adds funds to the user's cash balance. Use for manual deposits or corrections.",
    badgeColor: "bg-blue-600",
    icon: DollarSign,
  },
  withdraw: {
    label: "Withdraw Voucher",
    description: "Deducts funds from the user's cash balance. Use for manual withdrawals or payouts.",
    badgeColor: "bg-orange-600",
    icon: Wallet,
  },
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-600 text-white">Approved</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function CreateVoucherPage({ type }: { type: "limit" | "deposit" | "withdraw" }) {
  const router = useRouter();
  const { data: users = [], isLoading: usersLoading } = useOwnerUsers();
  const { data: allVouchers = [], isLoading: vouchersLoading } = useVouchers();
  const createVoucherMutation = useCreateVoucher();
  const updateVoucherMutation = useUpdateVoucher();
  const editModal = useModal<any>();
  const detailsModal = useModal<any>();
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    amount: "",
    method: "",
    reference: "",
    remarks: "",
    status: "approved",
  });
  const [error, setError] = useState<string | null>(null);

  const config = TYPE_CONFIG[type];
  const TypeIcon = config.icon;

  const selectedUser = users.find((u: any) => u.id === formData.userId);

  // Filter vouchers by current type and sort by date desc
  const filteredVouchers = useMemo(() => {
    return allVouchers
      .filter((v: any) => v.type === type)
      .sort((a: any, b: any) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
  }, [allVouchers, type]);

  const { items: paginatedVouchers, totalPages, currentPage, goToPage } = usePagination({
    data: filteredVouchers,
    itemsPerPage: 10,
  });

  const validateForm = () => {
    if (!formData.userId) return "Please select a user";
    if (!formData.amount?.trim()) return "Amount is required";
    if (parseFloat(formData.amount) <= 0) return "Amount must be greater than 0";
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const voucherData: any = {
      userId: formData.userId,
      type,
      amount: formData.amount.toString(),
      status: formData.status,
    };

    if (formData.method) voucherData.method = formData.method;
    if (formData.reference) voucherData.reference = formData.reference;
    if (formData.remarks) voucherData.remarks = formData.remarks;

    createVoucherMutation.mutate(voucherData, {
      onSuccess: () => {
        setFormData({
          userId: "",
          amount: "",
          method: "",
          reference: "",
          remarks: "",
          status: "approved",
        });
        setError(null);
      },
    });
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateVoucherMutation.mutate({ id, status });
  };

  const handleUpdateVoucher = (data: any) => {
    updateVoucherMutation.mutate(data);
    editModal.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/owner/vouchers")}
          className="h-9 w-9 p-0 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.badgeColor + "/10")}>
              <TypeIcon className={cn("h-5 w-5", config.badgeColor.replace("bg-", "text-"))} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{config.label}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{config.description}</p>
            </div>
          </div>
        </div>
        <Badge className={cn(config.badgeColor, "text-white capitalize hidden sm:inline-flex")}>
          {type}
        </Badge>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
          {error}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main fields - takes 2 cols */}
        <div className="xl:col-span-2 space-y-6">
          {/* User & Amount row */}
          <div className="rounded-lg border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <User className="h-4 w-4 text-muted-foreground" />
              User & Amount
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">
                  Select User <span className="text-destructive">*</span>
                </Label>
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      disabled={usersLoading}
                      className="bg-input border text-foreground h-11 w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {usersLoading
                          ? "Loading users..."
                          : selectedUser
                            ? `${selectedUser.username} (${selectedUser.email})`
                            : "Search and select a user..."}
                      </span>
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
                <Label className="text-foreground font-medium text-sm">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-input border text-foreground h-11 w-full pl-9"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment details */}
          <div className="rounded-lg border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Payment Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => setFormData({ ...formData, method: value })}
                >
                  <SelectTrigger className="bg-input border text-foreground h-11 w-full">
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
                <Label className="text-foreground font-medium text-sm">Reference</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="bg-input border text-foreground h-11 w-full"
                  placeholder="Transaction reference or ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="bg-input border text-foreground w-full min-h-[100px] resize-none"
                placeholder="Add any notes or remarks for this voucher..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar - Status & Summary */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Approval Status
            </div>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="bg-input border text-foreground h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.status === "approved"
                ? "The voucher will be applied and the user's ledger will be updated immediately."
                : "The voucher will be created but won't affect the ledger until approved."}
            </p>
          </div>

          {/* Summary */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="text-foreground font-semibold">Summary</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge className={cn(config.badgeColor, "text-white capitalize")}>{type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User</span>
                <span className="text-foreground font-medium truncate ml-4 text-right">
                  {selectedUser?.username || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground font-semibold">
                  {formData.amount ? parseFloat(formData.amount).toFixed(2) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={formData.status === "approved" ? "default" : "secondary"} className="capitalize">
                  {formData.status}
                </Badge>
              </div>
              {formData.method && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="text-foreground capitalize">{formData.method.replace("_", " ")}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={createVoucherMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full"
              >
                {createVoucherMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  `Create ${config.label}`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/owner/vouchers")}
                disabled={createVoucherMutation.isPending}
                className="h-10 w-full text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher History Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Recent {config.label}s
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredVouchers.length} voucher{filteredVouchers.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">User</th>
                <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium hidden md:table-cell">Method</th>
                <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium hidden lg:table-cell">Date</th>
                <th className="text-left py-3 px-4 text-muted-foreground text-sm font-medium">Actions</th>
              </tr>
            </thead>
            {vouchersLoading ? (
              <TableSkeleton columns={6} />
            ) : paginatedVouchers.length > 0 ? (
              <tbody>
                {paginatedVouchers.map((voucher: any) => (
                  <tr key={voucher.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-foreground text-sm font-medium">{voucher.username || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground lg:hidden">
                        {new Date(voucher.addedDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold text-sm">
                      {voucher.amount}
                      <div className="text-xs text-muted-foreground md:hidden">{voucher.method || "—"}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm capitalize hidden md:table-cell">
                      {voucher.method?.replace("_", " ") || "—"}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(voucher.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm hidden lg:table-cell">
                      {new Date(voucher.addedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => detailsModal.open(voucher)}
                          title="View Details"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {voucher.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editModal.open(voucher)}
                            title="Edit"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {voucher.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(voucher.id, "approved")}
                              title="Approve"
                              className="h-8 w-8 p-0 text-green-500 hover:text-green-400"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(voucher.id, "rejected")}
                              title="Reject"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <List className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">No {type} vouchers yet</p>
                      <p className="text-muted-foreground/60 text-xs">Create one using the form above</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <VoucherEditModal
        open={editModal.isOpen}
        onClose={editModal.close}
        voucher={editModal.data}
        onSave={handleUpdateVoucher}
      />

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.data && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Voucher Details</h3>
              <Button variant="ghost" size="sm" onClick={detailsModal.close} className="h-8 w-8 p-0">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User</label>
                  <p className="text-foreground">{detailsModal.data.username || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{detailsModal.data.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-foreground font-semibold">{detailsModal.data.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Method</label>
                  <p className="text-foreground capitalize">{detailsModal.data.method?.replace("_", " ") || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(detailsModal.data.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-foreground">{new Date(detailsModal.data.addedDate).toLocaleString()}</p>
                </div>
                {detailsModal.data.remarks && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                    <p className="text-foreground">{detailsModal.data.remarks}</p>
                  </div>
                )}
              </div>
              {detailsModal.data.reference && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground">Reference</label>
                  <p className="text-foreground font-mono text-sm break-all">{detailsModal.data.reference}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
