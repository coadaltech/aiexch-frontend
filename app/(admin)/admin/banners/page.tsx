"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { BannerModal } from "@/components/admin/banner-modal";
import { useBanners, useDeleteBanner } from "@/hooks/useAdmin";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function BannersPage() {
  const bannerModal = useModal<any>();
  const confirmDialog = useConfirm();

  const { data: banners = [], isLoading } = useBanners();
  const deleteMutation = useDeleteBanner();

  const { filteredData } = useFilters({
    data: banners,
    initialFilters: {
      status: "all",
    },
  });

  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "order", direction: "asc" },
  });

  const {
    items: paginatedBanners,
    totalPages,
    currentPage,
    goToPage,
  } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const handleCreateBanner = () => {
    bannerModal.open(null);
  };

  const handleEditBanner = (banner: any) => {
    bannerModal.open(banner);
  };

  const handleSaveBanner = () => {
    // Force refetch banners data
    // The mutation hooks already handle invalidation, but this ensures immediate refresh
  };

  const handleDeleteBanner = (id: number) => {
    confirmDialog.confirm(
      "Delete Banner",
      "Are you sure you want to delete this banner? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Banner Management
          </h1>
          <p className="text-muted-foreground">
            Manage homepage carousel banners
          </p>
        </div>
        <Button
          onClick={handleCreateBanner}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Banner
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Homepage Banners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Preview
                  </th>
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
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell">
                    Link
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
                  <th
                    className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("order")}
                  >
                    <div className="flex items-center gap-1">
                      Order
                      {getSortIcon("order") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("order") === "desc" && (
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
              ) : paginatedBanners.length > 0 ? (
                <tbody>
                  {paginatedBanners.map((banner: any) => (
                    <tr key={banner.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-12 h-8 sm:w-16 sm:h-10 object-cover rounded"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">
                          {banner.title}
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground truncate">
                          {banner.linkUrl}
                        </div>
                        <div className="md:hidden text-xs text-muted-foreground">
                          Order: {banner.order}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell truncate max-w-32">
                        {banner.linkUrl}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            banner.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {banner.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                        {banner.order}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditBanner(banner)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBanner(banner.id)}
                            title="Delete"
                            className="h-8 w-8 p-0 text-foreground hover:bg-accent hover:text-accent-foreground"
                            disabled={deleteMutation.isPending}
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
                      No banners found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BannerModal
        open={bannerModal.isOpen}
        onClose={bannerModal.close}
        banner={bannerModal.data}
        onSave={handleSaveBanner}
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
