"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Database } from "lucide-react";
import {
  useWhitelabels,
  useDeleteWhitelabel,
  useMigrateDatabase,
} from "@/hooks/useAdmin";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";

export default function WhitelabelsPage() {
  const router = useRouter();
  const confirmDialog = useConfirm();

  const { data: whitelabels = [], isLoading } = useWhitelabels();
  const deleteMutation = useDeleteWhitelabel();
  const migrateDbMutation = useMigrateDatabase();

  const handleCreateWhitelabel = () => {
    router.push("/admin/whitelabels/create");
  };

  const handleEditWhitelabel = (whitelabel: any) => {
    router.push(`/admin/whitelabels/edit/${whitelabel.id}`);
  };

  const handleMigration = (id: number) => {
    confirmDialog.confirm(
      "Migrate Database",
      "Are you sure you want to migrate the database? This action cannot be undone.",
      () => migrateDbMutation.mutate(id)
    );
  };

  const handleDeleteWhitelabel = (id: number) => {
    confirmDialog.confirm(
      "Delete White Label",
      "Are you sure you want to delete this white label? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            White Label Management
          </h1>
          <p className="text-muted-foreground">
            Manage white label casinos and their themes
          </p>
        </div>
        <Button
          onClick={handleCreateWhitelabel}
          className="bg-primary text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create White Label
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Active White Labels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell">
                    Domain
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Colors
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
                <TableSkeleton columns={5} />
              ) : whitelabels.length > 0 ? (
                <tbody>
                  {whitelabels.map((whitelabel: any) => (
                    <tr
                      key={whitelabel.id}
                      className="border-b border-border/50"
                    >
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">
                          {whitelabel.name}
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground truncate">
                          {whitelabel.domain}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell truncate max-w-32">
                        {whitelabel.domain}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{
                              backgroundColor:
                                whitelabel.theme?.primary || "#D4AF37",
                            }}
                            title="Primary Color"
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{
                              backgroundColor:
                                whitelabel.theme?.accent || "#FFD700",
                            }}
                            title="Accent Color"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            whitelabel.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {whitelabel.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMigration(whitelabel.id)}
                            title="Migrate DB"
                            className="h-8 w-8 p-0 text-foreground"
                            disabled={migrateDbMutation.isPending}
                          >
                            {migrateDbMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Database className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditWhitelabel(whitelabel)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-foreground"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDeleteWhitelabel(whitelabel.id)
                            }
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
                      No white labels found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

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
