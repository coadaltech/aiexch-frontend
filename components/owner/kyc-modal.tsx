"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, X, Eye, Download } from "lucide-react";
import { KYCModalProps } from "./types";

export function KYCModal({
  open,
  onClose,
  kycData,
  onApprove,
  onReject,
}: KYCModalProps) {
  const [notes, setNotes] = useState(kycData?.notes || "");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleApprove = () => {
    onApprove(kycData.id, notes);
    onClose();
  };

  const handleReject = () => {
    if (!notes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    onReject(kycData.id, notes);
    onClose();
  };

  if (!kycData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            KYC Review - {kycData.user}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">User Name</Label>
              <div className="text-foreground font-medium">{kycData.user}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <div className="text-foreground">{kycData.email}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Document Type</Label>
              <div className="text-foreground">{kycData.documentType}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge
                variant={
                  kycData.status === "approved"
                    ? "default"
                    : kycData.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {kycData.status}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Submitted Date</Label>
              <div className="text-foreground">{kycData.submittedDate}</div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <Label className="text-muted-foreground">Submitted Documents</Label>
            <div className="mt-2 space-y-2">
              {kycData.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-casino-darker rounded-lg"
                >
                  <span className="text-foreground">{doc}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-muted-foreground">
              {kycData.status === "pending" ? "Review Notes" : "Notes"}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-casino-darker border-casino-primary/30 mt-2"
              placeholder={
                kycData.status === "pending"
                  ? "Add notes about the review..."
                  : "View existing notes"
              }
              rows={4}
              disabled={kycData.status !== "pending"}
            />
          </div>

          {/* Action Buttons */}
          {kycData.status === "pending" && (
            <div className="flex gap-2 pt-4 border-t border-casino-primary/30">
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-foreground"
              >
                Cancel
              </Button>
            </div>
          )}

          {kycData.status !== "pending" && (
            <div className="flex gap-2 pt-4 border-t border-casino-primary/30">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-foreground"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
