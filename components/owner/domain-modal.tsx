"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Settings } from "lucide-react";
import { useDomains } from "@/hooks/useDomains";

interface DomainModalProps {
  open: boolean;
  onClose: () => void;
  domain?: any;
  onDomainCreated?: () => void;
}

export function DomainModal({ open, onClose, domain, onDomainCreated }: DomainModalProps) {
  const [domainName, setDomainName] = useState(domain?.name || "");
  const [status, setStatus] = useState(domain?.status || "active");
  const { createDomain, updateDomain, isCreating, isUpdating } = useDomains();

  React.useEffect(() => {
    if (domain) {
      setDomainName(domain.name || "");
      setStatus(domain.status || "active");
    } else {
      setDomainName("");
      setStatus("active");
    }
  }, [domain, open]);

  const handleSubmit = () => {
    if (!domainName) return;
    
    if (domain) {
      // Update existing domain
      updateDomain(domain.id, { name: domainName, status }, {
        onSuccess: () => {
          onDomainCreated?.();
          onClose();
        },
      });
    } else {
      // Create new domain
      createDomain(domainName, {
        onSuccess: () => {
          onDomainCreated?.();
          onClose();
          setDomainName("");
          setStatus("active");
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {domain ? "Edit Domain" : "Add Domain"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Domain Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="domain-name">Domain Name</Label>
                  <Input
                    id="domain-name"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    placeholder="example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={!domainName} isLoading={isCreating || isUpdating}>
                    {domain ? "Update Domain" : "Create Domain"}
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}