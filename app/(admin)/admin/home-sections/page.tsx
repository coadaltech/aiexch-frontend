"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Gamepad2 } from "lucide-react";
import { HomeSectionModal } from "@/components/admin/home-section-modal";
import { useHomeSections, useDeleteHomeSection } from "@/hooks/useAdmin";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

export default function HomeSectionsPage() {
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const confirmDialog = useConfirm();

  const { data: sections = [], isLoading } = useHomeSections();
  const deleteMutation = useDeleteHomeSection();

  const handleCreateSection = () => {
    setSelectedSection(null);
    setSectionModalOpen(true);
  };

  const handleEditSection = (section: any) => {
    setSelectedSection(section);
    setSectionModalOpen(true);
  };

  const handleDeleteSection = (id: number) => {
    confirmDialog.confirm(
      "Delete Section",
      "Are you sure you want to delete this section? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Home Sections
          </h1>
          <p className="text-muted-foreground">Manage homepage game sections</p>
        </div>
        <Button
          onClick={handleCreateSection}
          className="bg-primary text-primary-foreground w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Section
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Homepage Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Title
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                    Order
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
              ) : sections.length > 0 ? (
                <tbody>
                  {sections.map((section: any) => (
                    <tr key={section.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">
                          {section.title}
                        </div>
                        {section.subtitle && (
                          <div className="text-xs text-muted-foreground">
                            {section.subtitle}
                          </div>
                        )}
                        <div className="md:hidden text-xs text-muted-foreground">
                          Order: {section.order}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm">
                        {section.type}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">
                        {section.order}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            section.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {section.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            title="Manage Games"
                            className="h-8 w-8 p-0 text-foreground"
                          >
                            <Link
                              href={`/admin/home-sections/${section.id}/games`}
                            >
                              <Gamepad2 className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSection(section)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-foreground"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSection(section.id)}
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
                      No sections found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <HomeSectionModal
        open={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        section={selectedSection}
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
