"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { PromotionModal } from "@/components/admin/promotion-modal";
import { Pagination } from "@/components/admin/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePromotions, useDeletePromotion } from "@/hooks/useAdmin";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Image from "next/image";

export default function PromotionsPage() {
  const promotionModal = useModal<any>();
  const confirmDialog = useConfirm();

  const { data: promotions = [], isLoading } = usePromotions();
  const deleteMutation = useDeletePromotion();

  const { filters, filteredData, updateFilter } = useFilters({
    data: promotions,
    initialFilters: {
      status: "all",
    },
  });

  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "title", direction: "asc" },
  });

  const {
    items: paginatedPromotions,
    totalPages,
    currentPage,
    goToPage,
  } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const handleCreatePromotion = () => {
    promotionModal.open(null);
  };

  const handleEditPromotion = (promotion: any) => {
    promotionModal.open(promotion);
  };

  const handleSavePromotion = () => {
    // Hook will automatically invalidate queries
  };

  const handleDeletePromotion = (id: number) => {
    confirmDialog.confirm(
      "Delete Promotion",
      "Are you sure you want to delete this promotion? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Promotions
          </h1>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns
          </p>
        </div>
        <Button
          onClick={handleCreatePromotion}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-foreground">Promotions</CardTitle>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger className="w-full sm:w-32 bg-background border text-foreground hover:bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border text-black">
                <SelectItem
                  value="all"
                  className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  All Status
                </SelectItem>
                <SelectItem
                  value="active"
                  className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  Active
                </SelectItem>
                <SelectItem
                  value="paused"
                  className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                >
                  Paused
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      {getSortIcon("title") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("title") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Image
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("type")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {getSortIcon("type") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("type") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon("status") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("status") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>

                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : paginatedPromotions.length > 0 ? (
                <tbody>
                  {paginatedPromotions.map((promo: any) => (
                    <tr key={promo.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">
                          {promo.title}
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          {promo.type}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Image
                          src={promo.imageUrl}
                          alt={promo.title}
                          height={48}
                          width={32}
                          className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded"
                        />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell">
                        {promo.type}
                      </td>

                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            promo.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {promo.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPromotion(promo)}
                            title="Edit Promotion"
                            className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePromotion(promo.id)}
                            title="Delete Promotion"
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No promotions found
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

      <PromotionModal
        open={promotionModal.isOpen}
        onClose={promotionModal.close}
        promotion={promotionModal.data}
        onSave={handleSavePromotion}
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
