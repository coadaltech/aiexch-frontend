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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ChevronsUpDown,
  Check,
  ArrowLeft,
  DollarSign,
  Shield,
  Wallet,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOwnerUsers, useCreateVoucher, useVouchers, useUpdateVoucher } from "@/hooks/useOwner";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/owner/skeletons";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/pagination";
import { useModal } from "@/hooks/useModal";
import { VoucherEditModal } from "@/components/owner/voucher-edit-modal";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { useDebounce } from "@/hooks/useDebounce";

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
  const { data: allVouchers = [], isLoading: vouchersLoading, error } = useVouchers();
  const updateVoucherMutation = useUpdateVoucher();
  const createVoucherMutation = useCreateVoucher();
  const createModal = useModal();
  const editModal = useModal<any>();
  const detailsModal = useModal<any>();
  const imageModal = useModal<string>();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const config = TYPE_CONFIG[type];
  const TypeIcon = config.icon;

  // Pre-filter vouchers by type
  const typeVouchers = useMemo(() => {
    return allVouchers.filter((v: any) => v.type === type);
  }, [allVouchers, type]);

  const { filters, filteredData, updateFilter, hasActiveFilters } = useFilters({
    data: typeVouchers,
    initialFilters: {
      search: debouncedSearch,
      status: "all",
      method: "all",
      dateFrom: "",
      dateTo: "",
    },
  });

  // Check if user has applied any filter or search
  const hasAppliedFilters = hasActiveFilters || debouncedSearch.length > 0;

  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: hasAppliedFilters ? filteredData : [],
    initialSort: { key: "addedDate", direction: "desc" },
  });

  const { items: paginatedVouchers, totalPages, currentPage, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateVoucherMutation.mutate({ id, status });
  };

  const handleEditVoucher = (voucher: any) => {
    editModal.open(voucher);
  };

  const handleUpdateVoucher = (data: any) => {
    updateVoucherMutation.mutate(data);
    editModal.close();
  };

  const handleSaveVoucher = (voucherData: any) => {
    createVoucherMutation.mutate(voucherData, {
      onSuccess: () => {
        createModal.close();
      },
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="bg-card border max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Failed to Load Vouchers</h3>
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching voucher data. Please try again.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{config.label}s</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{config.description}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => createModal.open()}
          className="bg-primary text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {config.label}
        </Button>
      </div>

      {/* Filters & Table */}
      <Card className="bg-card border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <CardTitle className="text-foreground">{config.label} Management</CardTitle>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-black">
                    <SelectItem value="all" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">All Status</SelectItem>
                    <SelectItem value="pending" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Pending</SelectItem>
                    <SelectItem value="approved" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Approved</SelectItem>
                    <SelectItem value="rejected" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.method} onValueChange={(value) => updateFilter("method", value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-black">
                    <SelectItem value="all" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">All Methods</SelectItem>
                    <SelectItem value="admin_credits" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Admin Credits</SelectItem>
                    <SelectItem value="crypto" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Crypto</SelectItem>
                    <SelectItem value="bank" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Bank Transfer</SelectItem>
                    <SelectItem value="promocode" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Promocode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                  className="w-full sm:w-40 bg-input border text-foreground [&::-webkit-calendar-picker-indicator]:invert"
                  placeholder="From date"
                />

                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                  className="w-full sm:w-40 bg-input border text-foreground [&::-webkit-calendar-picker-indicator]:invert"
                  placeholder="To date"
                />

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vouchers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-input border"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasAppliedFilters ? (
            <div className="py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-base font-medium">Search or apply filters to view {type} vouchers</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Use the search bar or filters above to find specific vouchers
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort("username")}>
                        <div className="flex items-center gap-1">
                          User
                          {getSortIcon("username") === "asc" && <ChevronUp className="w-3 h-3" />}
                          {getSortIcon("username") === "desc" && <ChevronDown className="w-3 h-3" />}
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort("amount")}>
                        <div className="flex items-center gap-1">
                          Amount
                          {getSortIcon("amount") === "asc" && <ChevronUp className="w-3 h-3" />}
                          {getSortIcon("amount") === "desc" && <ChevronDown className="w-3 h-3" />}
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">Method</th>
                      <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell">Proof</th>
                      <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort("status")}>
                        <div className="flex items-center gap-1">
                          Status
                          {getSortIcon("status") === "asc" && <ChevronUp className="w-3 h-3" />}
                          {getSortIcon("status") === "desc" && <ChevronDown className="w-3 h-3" />}
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort("addedDate")}>
                        <div className="flex items-center gap-1">
                          Date
                          {getSortIcon("addedDate") === "asc" && <ChevronUp className="w-3 h-3" />}
                          {getSortIcon("addedDate") === "desc" && <ChevronDown className="w-3 h-3" />}
                        </div>
                      </th>
                      <th className="text-left py-3 px-2 text-muted-foreground text-sm">Actions</th>
                    </tr>
                  </thead>
                  {vouchersLoading ? (
                    <TableSkeleton columns={7} />
                  ) : paginatedVouchers.length > 0 ? (
                    <tbody>
                      {paginatedVouchers.map((voucher: any) => (
                        <tr key={voucher.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 text-foreground text-sm hidden sm:table-cell">
                            {voucher.username || "Unknown"}
                          </td>
                          <td className="py-3 px-2 text-foreground font-medium text-sm">
                            {voucher.amount}
                            <div className="sm:hidden text-xs text-muted-foreground">{voucher.username || "Unknown"}</div>
                            <div className="md:hidden text-xs text-muted-foreground">{voucher.method || "N/A"}</div>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground text-sm hidden md:table-cell capitalize">
                            {voucher.method?.replace("_", " ") || "N/A"}
                          </td>
                          <td className="py-3 px-2 hidden lg:table-cell">
                            {voucher.proofImage ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => imageModal.open(voucher.proofImage)}
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400"
                                title="View Proof Image"
                              >
                                <Image className="h-3 w-3" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">No image</span>
                            )}
                          </td>
                          <td className="py-3 px-2">{getStatusBadge(voucher.status)}</td>
                          <td className="py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell">
                            {new Date(voucher.addedDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => detailsModal.open(voucher)}
                                title="View Details"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {voucher.proofImage && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => imageModal.open(voucher.proofImage)}
                                  title="View Proof Image"
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 lg:hidden"
                                >
                                  <Image className="h-3 w-3" />
                                </Button>
                              )}
                              {voucher.status !== "approved" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditVoucher(voucher)}
                                  title="Edit"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
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
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUpdateStatus(voucher.id, "rejected")}
                                    title="Reject"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
                                  >
                                    <XCircle className="h-3 w-3" />
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
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No {type} vouchers found matching your filters
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Voucher Modal */}
      <AddVoucherModal
        type={type}
        config={config}
        open={createModal.isOpen}
        onClose={createModal.close}
        onSave={handleSaveVoucher}
        isLoading={createVoucherMutation.isPending}
      />

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
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Voucher Details</h3>
              <Button variant="ghost" size="sm" onClick={detailsModal.close} className="h-8 w-8 p-0">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Voucher ID</label>
                  <p className="text-foreground font-mono text-sm">{detailsModal.data.id}</p>
                </div>
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
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                    <p className="text-foreground">{detailsModal.data.remarks}</p>
                  </div>
                )}
              </div>
              {detailsModal.data.reference && (
                <div className="border-t pt-4">
                  {detailsModal.data.type === "withdraw" && (() => {
                    try {
                      const parsed = JSON.parse(detailsModal.data.reference);
                      if (parsed.accountName) {
                        return (
                          <>
                            <h4 className="font-medium text-foreground mb-3">Bank Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Account Holder</label>
                                <p className="text-foreground">{parsed.accountName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                                <p className="text-foreground font-mono">{parsed.accountNumber}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
                                <p className="text-foreground">{parsed.ifscCode}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                                <p className="text-foreground">{parsed.bankName}</p>
                              </div>
                            </div>
                          </>
                        );
                      }
                    } catch { }
                    return null;
                  })()}
                  {!(detailsModal.data.type === "withdraw" && (() => { try { return JSON.parse(detailsModal.data.reference)?.accountName; } catch { return false; } })()) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reference</label>
                      <p className="text-foreground font-mono text-sm break-all">{detailsModal.data.reference}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && imageModal.data && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Payment Proof</h3>
              <Button variant="ghost" size="sm" onClick={imageModal.close} className="h-8 w-8 p-0">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={imageModal.data}
                alt="Payment Proof"
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: "70vh" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Voucher Modal - type is auto-set, no type selection field
function AddVoucherModal({
  type,
  config,
  open,
  onClose,
  onSave,
  isLoading,
}: {
  type: string;
  config: { label: string; badgeColor: string };
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading?: boolean;
}) {
  const { data: users = [], isLoading: usersLoading } = useOwnerUsers();
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

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        userId: "",
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
    if (parseFloat(formData.amount) <= 0) return "Amount must be greater than 0";
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
      type,
      amount: formData.amount.toString(),
      status: formData.status,
    };

    if (formData.method) voucherData.method = formData.method;
    if (formData.reference) voucherData.reference = formData.reference;
    if (formData.remarks) voucherData.remarks = formData.remarks;

    onSave(voucherData);
  };

  const selectedUser = users.find((u: any) => u.id === formData.userId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[95vh] overflow-y-auto max-w-3xl w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-foreground text-xl font-semibold flex items-center gap-2">
            Add {config.label}
            <Badge className={cn(config.badgeColor, "text-white capitalize text-xs")}>{type}</Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Create a new {type} voucher for a user
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
                      className="bg-input border text-foreground h-10 w-full justify-between font-normal"
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
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-input border text-foreground h-10 w-full"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Payment Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => setFormData({ ...formData, method: value })}
                >
                  <SelectTrigger className="bg-input border text-foreground h-10 w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="admin_credits">Admin Credits</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Reference</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="bg-input border text-foreground h-10 w-full"
                  placeholder="Transaction reference or ID"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-input border text-foreground h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="approved">Approved (Ledger updated immediately)</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              `Create ${config.label}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
