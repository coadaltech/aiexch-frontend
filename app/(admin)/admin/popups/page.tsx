"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { PopupModal } from "@/components/admin/popup-modal";
import { usePopups, useDeletePopup } from "@/hooks/useAdmin";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function PopupsPage() {
  const popupModal = useModal<any>();
  const confirmDialog = useConfirm();

  const { data: popups = [], isLoading } = usePopups();
  const deleteMutation = useDeletePopup();

  const handleCreatePopup = () => {
    popupModal.open(null);
  };

  const handleEditPopup = (popup: any) => {
    popupModal.open({
      ...popup,
      targetPage: popup.targetPage || popup.target_page || "",
      imageUrl: popup.imageUrl || popup.image_url || "",
    });
  };

  const handleSavePopup = () => {
    // Hook will automatically invalidate queries
  };

  const handleDeletePopup = (id: number) => {
    confirmDialog.confirm(
      "Delete Popup",
      "Are you sure you want to delete this popup? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Popup Management
          </h1>
          <p className="text-muted-foreground">
            Manage welcome popups and promotional overlays
          </p>
        </div>
        <Button
          onClick={handleCreatePopup}
          className="bg-primary text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Popup
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Active Popups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Title
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                    Preview
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell">
                    Target Page
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={7} />
              ) : popups.length > 0 ? (
                <tbody>
                  {popups.map((popup: any) => (
                    <tr key={popup.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">
                          {popup.title}
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          {popup.targetPage || popup.target_page}
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        {popup.imageUrl || popup.image_url ? (
                          <img 
                            src={popup.imageUrl || popup.image_url} 
                            alt="Popup preview" 
                            className="w-16 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">No image</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell capitalize">
                        {popup.targetPage || popup.target_page}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            popup.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {popup.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPopup(popup)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-foreground"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePopup(popup.id)}
                            title="Delete"
                            className="h-8 w-8 p-0 text-foreground"
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
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No popups found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <PopupModal
        open={popupModal.isOpen}
        onClose={popupModal.close}
        popup={popupModal.data}
        onSave={handleSavePopup}
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
