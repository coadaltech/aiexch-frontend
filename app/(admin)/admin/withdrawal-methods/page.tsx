"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Ban, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { WithdrawalMethodModal } from "@/components/admin/withdrawal-method-modal";
import { useWithdrawalMethods, useDeleteWithdrawalMethod, useUpdateWithdrawalMethod } from "@/hooks/useAdmin";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function WithdrawalMethodsPage() {
  const methodModal = useModal<any>();
  const confirmDialog = useConfirm();

  const { data: methods = [], isLoading } = useWithdrawalMethods();
  const deleteMutation = useDeleteWithdrawalMethod();
  const updateMutation = useUpdateWithdrawalMethod();
  
  const { filters, filteredData, updateFilter } = useFilters({
    data: methods,
    initialFilters: {
      status: "all",
      type: "all"
    }
  });
  
  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "name", direction: "asc" }
  });
  
  const { items: paginatedMethods, totalPages, currentPage, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10
  });

  const handleCreateMethod = () => {
    methodModal.open(null);
  };

  const handleEditMethod = (method: any) => {
    methodModal.open(method);
  };

  const handleDeleteMethod = (id: number) => {
    confirmDialog.confirm(
      "Delete Withdrawal Method",
      "Are you sure you want to delete this withdrawal method? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  const handleToggleStatus = (method: any) => {
    const newStatus = method.status === "active" ? "suspended" : "active";
    updateMutation.mutate({
      id: method.id,
      status: newStatus
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Withdrawal Methods</h1>
          <p className="text-muted-foreground">Manage available withdrawal methods and their settings</p>
        </div>
        <Button onClick={handleCreateMethod} className="bg-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Withdrawal Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('name')}>
                    <div className="flex items-center gap-1">
                      Method
                      {getSortIcon('name') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('name') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('type')}>
                    <div className="flex items-center gap-1">
                      Type
                      {getSortIcon('type') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('type') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('currency')}>
                    <div className="flex items-center gap-1">
                      Currency
                      {getSortIcon('currency') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('currency') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('minAmount')}>
                    <div className="flex items-center gap-1">
                      Limits
                      {getSortIcon('minAmount') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('minAmount') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('feePercentage')}>
                    <div className="flex items-center gap-1">
                      Fees
                      {getSortIcon('feePercentage') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('feePercentage') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('status')}>
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('status') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">Actions</th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={7} />
              ) : paginatedMethods.length > 0 ? (
                <tbody>
                  {paginatedMethods.map((method: any) => (
                    <tr key={method.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">{method.name}</div>
                        <div className="text-xs text-muted-foreground">{method.processingTime}</div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">{method.type}</Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">{method.currency}</td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">
                        {method.minAmount} - {method.maxAmount}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">
                        {method.feePercentage}% + {method.feeFixed}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={method.status === "active" ? "default" : "destructive"} className="text-xs">
                          {method.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(method)} 
                            title={method.status === "active" ? "Suspend" : "Activate"}
                            className="h-8 w-8 p-0 text-foreground"
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : method.status === "active" ? (
                              <Ban className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditMethod(method)} title="Edit" className="h-8 w-8 p-0 text-foreground">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteMethod(method.id)} 
                            title="Delete" 
                            className="h-8 w-8 p-0 text-foreground"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No withdrawal methods found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">{currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <WithdrawalMethodModal
        open={methodModal.isOpen}
        onClose={methodModal.close}
        method={methodModal.data}
      />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.config?.title || ""}
        message={confirmDialog.config?.message || ""}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
    </div>
  );
}