"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, QrCode, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { QrCodeModal } from "@/components/admin/qrcode-modal";
import { useQrCodes, useDeleteQrCode } from "@/hooks/useAdmin";
import { useFilters } from "@/hooks/useFilters";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { TableSkeleton } from "@/components/admin/skeletons";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function QrCodesPage() {
  const qrCodeModal = useModal<any>();
  const confirmDialog = useConfirm();

  const { data: qrCodes = [], isLoading } = useQrCodes();
  const deleteMutation = useDeleteQrCode();
  
  const { filters, filteredData, updateFilter } = useFilters({
    data: qrCodes,
    initialFilters: {
      status: "all"
    }
  });
  
  const { sortedData, requestSort, getSortIcon } = useTableSort({
    data: filteredData,
    initialSort: { key: "paymentMethod", direction: "asc" }
  });
  
  const { items: paginatedQrCodes, totalPages, currentPage, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10
  });

  const handleCreateQrCode = () => {
    qrCodeModal.open(null);
  };

  const handleEditQrCode = (qrCode: any) => {
    qrCodeModal.open(qrCode);
  };

  const handleDeleteQrCode = (id: number) => {
    confirmDialog.confirm(
      "Delete QR Code",
      "Are you sure you want to delete this QR code? This action cannot be undone.",
      () => deleteMutation.mutate(id)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">QR Codes</h1>
          <p className="text-muted-foreground">Manage payment method QR codes for deposits</p>
        </div>
        <Button onClick={handleCreateQrCode} className="bg-primary text-primary-foreground w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add QR Code
        </Button>
      </div>

      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground">Payment QR Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => requestSort('paymentMethod')}>
                    <div className="flex items-center gap-1">
                      Payment Method
                      {getSortIcon('paymentMethod') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('paymentMethod') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell cursor-pointer hover:text-foreground" onClick={() => requestSort('currency')}>
                    <div className="flex items-center gap-1">
                      Currency
                      {getSortIcon('currency') === 'asc' && <ChevronUp className="w-3 h-3" />}
                      {getSortIcon('currency') === 'desc' && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden sm:table-cell">QR Code</th>
                  <th className="text-left py-3 px-2 text-muted-foreground text-sm hidden md:table-cell">Wallet Address</th>
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
                <TableSkeleton columns={6} />
              ) : paginatedQrCodes.length > 0 ? (
                <tbody>
                  {paginatedQrCodes.map((qrCode: any) => (
                    <tr key={qrCode.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground text-sm">{qrCode.paymentMethod}</div>
                        <div className="sm:hidden text-xs text-muted-foreground truncate">{qrCode.currency || 'INR'} • {qrCode.walletAddress}</div>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">{qrCode.currency || 'INR'}</Badge>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        {qrCode.qrCodeUrl ? (
                          <img src={qrCode.qrCodeUrl} alt="QR Code" className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <QrCode className="w-12 h-12 text-muted-foreground" />
                        )}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-sm hidden md:table-cell truncate max-w-32">
                        {qrCode.walletAddress || 'N/A'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={qrCode.status === "active" ? "default" : "secondary"} className="text-xs">
                          {qrCode.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditQrCode(qrCode)} title="Edit" className="h-8 w-8 p-0 text-foreground">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteQrCode(qrCode.id)} 
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
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No QR codes found
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
      
      <QrCodeModal
        open={qrCodeModal.isOpen}
        onClose={qrCodeModal.close}
        qrCode={qrCodeModal.data}
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