"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  CheckCircle,
  X,
  Download,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { KYCModal } from "@/components/admin/kyc-modal";
import { useKycDocuments, useUpdateKyc } from "@/hooks/useAdmin";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";

export default function KYCPage() {
  const kycModal = useModal<any>();

  const { data: kycSubmissions = [], isLoading, error } = useKycDocuments();
  const updateKycMutation = useUpdateKyc();

  const { filters, filteredData, updateFilter } = useFilters({
    data: kycSubmissions,
    initialFilters: {
      status: "all",
    },
  });

  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "createdAt", direction: "desc" },
  });

  const {
    items: paginatedKyc,
    totalPages,
    currentPage,
    goToPage,
  } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  const handleViewKyc = (submission: any) => {
    kycModal.open(submission);
  };

  const handleApproveKyc = (id: string, notes?: string) => {
    updateKycMutation.mutate({
      id: parseInt(id),
      status: "approved",
      reviewNotes: notes,
    });
    kycModal.close();
  };

  const handleRejectKyc = (id: string, notes: string) => {
    updateKycMutation.mutate({
      id: parseInt(id),
      status: "rejected",
      reviewNotes: notes,
    });
    kycModal.close();
  };

  const quickApprove = (id: number) => {
    updateKycMutation.mutate({ id, status: "approved" });
  };

  const quickReject = (id: number) => {
    updateKycMutation.mutate({ id, status: "rejected" });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          Error loading KYC documents: {error.message}
        </div>
      </div>
    );
  }

  const pendingCount = kycSubmissions.filter(
    (k: { status: string }) => k.status === "pending"
  ).length;
  const approvedCount = kycSubmissions.filter(
    (k: { status: string }) => k.status === "approved"
  ).length;
  const rejectedCount = kycSubmissions.filter(
    (k: { status: string }) => k.status === "rejected"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">KYC Verification</h1>
        <p className="text-muted-foreground">
          Review and manage user identity verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-foreground">
              {pendingCount}
            </div>
            <p className="text-muted-foreground">Pending Reviews</p>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-500">
              {approvedCount}
            </div>
            <p className="text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-500">
              {rejectedCount}
            </div>
            <p className="text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">KYC Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th
                    className="text-left py-3 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("fullName")}
                  >
                    <div className="flex items-center gap-1">
                      User
                      {getSortIcon("fullName") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("fullName") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("documentType")}
                  >
                    <div className="flex items-center gap-1">
                      Documents
                      {getSortIcon("documentType") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("documentType") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 text-muted-foreground cursor-pointer hover:text-foreground"
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
                    className="text-left py-3 text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => requestSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Submitted
                      {getSortIcon("createdAt") === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {getSortIcon("createdAt") === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton columns={5} />
              ) : paginatedKyc.length > 0 ? (
                <tbody>
                  {paginatedKyc.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-border/50"
                    >
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {submission.fullName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {submission.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {submission.documentType}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            submission.status === "approved"
                              ? "default"
                              : submission.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewKyc(submission)}
                            title="View Documents"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                          {submission.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => quickApprove(submission.id)}
                                disabled={updateKycMutation.isPending}
                                title="Quick Approve"
                              >
                                {updateKycMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => quickReject(submission.id)}
                                disabled={updateKycMutation.isPending}
                                title="Quick Reject"
                              >
                                {updateKycMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 text-red-500" />
                                )}
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
                    <td
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No KYC submissions found
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedKyc.length} of {sortedData.length}{" "}
                  submissions
                </p>
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
            </div>
          )}
        </CardContent>
      </Card>

      <KYCModal
        open={kycModal.isOpen}
        onClose={kycModal.close}
        kycData={kycModal.data}
        onApprove={handleApproveKyc}
        onReject={handleRejectKyc}
      />
    </div>
  );
}
