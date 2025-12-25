"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye, ChevronUp, ChevronDown } from "lucide-react";
import { useAdminPromocodes, useUpdatePromocode, useDeletePromocode, useCreatePromocode } from "@/hooks/useAdmin";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { PromoCodeModal } from "@/components/admin/promocode-modal";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function PromocodesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const promocodeModal = useModal<any>();
  const confirmDialog = useConfirm();

  const { data: promocodes = [], isLoading, error } = useAdminPromocodes();
  const updatePromocodeMutation = useUpdatePromocode();
  const deletePromocodeMutation = useDeletePromocode();
  const createPromocodeMutation = useCreatePromocode();
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { filters, filteredData, updateFilter } = useFilters({
    data: promocodes,
    initialFilters: {
      search: debouncedSearch,
      status: "all",
      type: "all"
    }
  });
  
  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "code", direction: "asc" }
  });
  
  const { items: paginatedPromocodes, totalPages, currentPage, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10
  });

  const handleCreatePromocode = () => {
    promocodeModal.open(null);
  };

  const handleEditPromocode = (promocode: any) => {
    promocodeModal.open(promocode);
  };

  const handleSavePromocode = (promocodeData: any) => {
    if (promocodeModal.data) {
      updatePromocodeMutation.mutate({ id: promocodeModal.data.id, ...promocodeData });
    } else {
      createPromocodeMutation.mutate(promocodeData);
    }
    promocodeModal.close();
  };

  const handleDeletePromocode = (id: number) => {
    confirmDialog.confirm(
      "Delete Promocode",
      "Are you sure you want to delete this promocode? This action cannot be undone.",
      () => deletePromocodeMutation.mutate(id)
    );
  };

  const handleToggleStatus = (promocode: any) => {
    const newStatus = promocode.status === "active" ? "inactive" : "active";
    updatePromocodeMutation.mutate({ id: promocode.id, status: newStatus });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading promocodes</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Promocodes</h1>
          <p className="text-muted-foreground">Manage promotional codes and discounts</p>
        </div>
        <Button onClick={handleCreatePromocode} className="bg-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Promocode
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <CardTitle className="text-foreground">Promocode Management</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex gap-2">
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-input border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                  <SelectTrigger className="w-full sm:w-32 bg-input border">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search promocodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('code')}>
                    <div className="flex items-center gap-1">
                      Code
                      {getSortIcon('code') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('code') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort('type')}>
                    <div className="flex items-center gap-1">
                      Type
                      {getSortIcon('type') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('type') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('value')}>
                    <div className="flex items-center gap-1">
                      Value
                      {getSortIcon('value') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('value') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort('usedCount')}>
                    <div className="flex items-center gap-1">
                      Usage
                      {getSortIcon('usedCount') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('usedCount') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort('validTo')}>
                    <div className="flex items-center gap-1">
                      Valid Until
                      {getSortIcon('validTo') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('validTo') === 'desc' && <ChevronDown className="w-3 h-3" />}
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
              ) : paginatedPromocodes.length > 0 ? (
                <tbody>
                  {paginatedPromocodes.map((promocode) => (
                    <tr key={promocode.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">{promocode.code}</div>
                        <div className="sm:hidden text-xs text-muted-foreground">{promocode.type}</div>
                        <div className="md:hidden text-xs text-muted-foreground">
                          {promocode.usedCount || 0}/{promocode.usageLimit || "∞"}
                        </div>
                        <div className="lg:hidden text-xs text-muted-foreground">
                          {promocode.validTo ? new Date(promocode.validTo).toLocaleDateString() : "No expiry"}
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">{promocode.type}</Badge>
                      </td>
                      <td className="py-3 px-2 text-foreground text-sm">{promocode.value}</td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                        {promocode.usedCount || 0}/{promocode.usageLimit || "∞"}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden lg:table-cell">
                        {promocode.validTo ? new Date(promocode.validTo).toLocaleDateString() : "No expiry"}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={promocode.status === "active" ? "default" : "secondary"} className="text-xs">
                          {promocode.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" title="View Details" className="h-8 w-8 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditPromocode(promocode)} title="Edit" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeletePromocode(promocode.id)}
                            title="Delete"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
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
                      No promocodes found
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
      
      <PromoCodeModal
        key={promocodeModal.data?.id || 'new'}
        open={promocodeModal.isOpen}
        onClose={promocodeModal.close}
        promocode={promocodeModal.data}
        onSave={handleSavePromocode}
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