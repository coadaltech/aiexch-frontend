"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DatabaseErrorDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DatabaseErrorDialog({ open, onClose }: DatabaseErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-foreground text-xl">
              Database Not Found
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-base pt-2">
            The database for this white label does not exist. Please contact the owner to create the database.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={onClose}
            variant="default"
            className="bg-primary text-primary-foreground"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
