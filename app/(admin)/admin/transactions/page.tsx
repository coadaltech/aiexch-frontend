"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, Plus, Edit, Image, ChevronUp, ChevronDown } from "lucide-react";
import { useTransactions, useUpdateTransaction, useCreateTransaction } from "@/hooks/useAdmin";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { TransactionModal } from "@/components/admin/transaction-modal";
import { TransactionEditModal } from "@/components/admin/transaction-edit-modal";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const createModal = useModal();
  const editModal = useModal<any>();
  const imageModal = useModal<string>();
  const detailsModal = useModal<any>();

  const { data: transactions = [], isLoading, error } = useTransactions();
  const updateTransactionMutation = useUpdateTransaction();
  const createTransactionMutation = useCreateTransaction();
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { filters, filteredData, updateFilter } = useFilters({
    data: transactions,
    initialFilters: {
      search: debouncedSearch,
      status: "all",
      type: "all",
      dateFrom: "",
      dateTo: ""
    }
  });
  
  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "createdAt", direction: "desc" }
  });
  
  const { items: paginatedTransactions, totalPages, currentPage, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10
  });



  const handleUpdateStatus = (id: number, status: string) => {
    updateTransactionMutation.mutate({ id, status });
  };

  const handleCreateTransaction = () => {
    createModal.open();
  };

  const handleSaveTransaction = (transactionData: any) => {
    createTransactionMutation.mutate(transactionData);
    createModal.close();
  };

  const handleEditTransaction = (transaction: any) => {
    editModal.open(transaction);
  };

  const handleUpdateTransaction = (data: any) => {
    updateTransactionMutation.mutate(data);
    editModal.close();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-blue-600">Deposit</Badge>;
      case "withdrawal":
        return <Badge className="bg-orange-600">Withdrawal</Badge>;
      case "bonus":
        return <Badge className="bg-purple-600">Bonus</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading transactions</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Monitor and manage user transactions</p>
        </div>
        <Button onClick={handleCreateTransaction} className="bg-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <CardTitle className="text-foreground">Transaction Management</CardTitle>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-black">
                    <SelectItem value="all" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">All Status</SelectItem>
                    <SelectItem value="pending" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Pending</SelectItem>
                    <SelectItem value="completed" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Completed</SelectItem>
                    <SelectItem value="failed" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Failed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border text-black">
                    <SelectItem value="all" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">All Types</SelectItem>
                    <SelectItem value="deposit" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Deposit</SelectItem>
                    <SelectItem value="withdraw" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Withdraw</SelectItem>
                    <SelectItem value="bonus" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Bonus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full sm:w-40 bg-input border text-foreground [&::-webkit-calendar-picker-indicator]:invert"
                  placeholder="From date"
                />
                
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full sm:w-40 bg-input border text-foreground [&::-webkit-calendar-picker-indicator]:invert"
                  placeholder="To date"
                />
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
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
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('id')}>
                    <div className="flex items-center gap-1">
                      Reference
                      {getSortIcon('id') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('id') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort('userId')}>
                    <div className="flex items-center gap-1">
                      User ID
                      {getSortIcon('userId') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('userId') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('type')}>
                    <div className="flex items-center gap-1">
                      Type
                      {getSortIcon('type') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('type') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('amount')}>
                    <div className="flex items-center gap-1">
                      Amount
                      {getSortIcon('amount') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('amount') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">Method</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell">Proof</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('status')}>
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('status') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      Date
                      {getSortIcon('createdAt') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('createdAt') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Actions</th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={8} />
              ) : paginatedTransactions.length > 0 ? (
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">#{transaction.id}</div>
                        <div className="sm:hidden text-xs text-muted-foreground">ID: {transaction.userId}</div>
                        <div className="lg:hidden text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell">{transaction.userId}</td>
                      <td className="py-3 px-2">{getTypeBadge(transaction.type)}</td>
                      <td className="py-3 px-2 text-foreground font-medium text-sm">
                        {transaction.amount} {transaction.currency}
                        <div className="md:hidden text-xs text-muted-foreground">{transaction.method || "N/A"}</div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">{transaction.method || "N/A"}</td>
                      <td className="py-3 px-2 hidden lg:table-cell">
                        {transaction.proofImage ? (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => imageModal.open(transaction.proofImage)}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400"
                            title="View Proof Image"
                          >
                            <Image className="h-3 w-3" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">No image</span>
                        )}
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(transaction.status)}</td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => detailsModal.open(transaction)}
                            title="View Details" 
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {transaction.proofImage && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => imageModal.open(transaction.proofImage)}
                              title="View Proof Image"
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 lg:hidden"
                            >
                              <Image className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEditTransaction(transaction)} title="Edit" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          {transaction.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleUpdateStatus(transaction.id, "completed")}
                                title="Approve"
                                className="h-8 w-8 p-0 text-green-500 hover:text-green-400"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleUpdateStatus(transaction.id, "failed")}
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
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        </CardContent>
      </Card>
      
      <TransactionModal
        open={createModal.isOpen}
        onClose={createModal.close}
        onSave={handleSaveTransaction}
      />
      
      <TransactionEditModal
        open={editModal.isOpen}
        onClose={editModal.close}
        transaction={editModal.data}
        onSave={handleUpdateTransaction}
      />
      
      {/* Transaction Details Modal */}
      {detailsModal.isOpen && detailsModal.data && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-foreground">Transaction Details</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={detailsModal.close}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                  <p className="text-foreground">{detailsModal.data.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-foreground">{detailsModal.data.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-foreground">{detailsModal.data.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-foreground">{detailsModal.data.amount} {detailsModal.data.currency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Method</label>
                  <p className="text-foreground">{detailsModal.data.method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-foreground">{detailsModal.data.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-foreground">{new Date(detailsModal.data.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {detailsModal.data.type === 'withdraw' && detailsModal.data.reference && (() => {
                try {
                  const parsed = JSON.parse(detailsModal.data.reference);
                  if (parsed.accountName) {
                    return (
                      <div className="border-t pt-4">
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
                      </div>
                    );
                  }
                } catch {}
                return null;
              })()}
              
              {detailsModal.data.withdrawalAddress && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground">Withdrawal Address</label>
                  <p className="text-foreground font-mono break-all">{detailsModal.data.withdrawalAddress}</p>
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={imageModal.close}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img 
                src={imageModal.data} 
                alt="Payment Proof" 
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: '70vh' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}