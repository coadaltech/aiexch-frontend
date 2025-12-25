"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Globe, Trash2, Edit } from "lucide-react";
import { DomainModal } from "@/components/admin/domain-modal";
import { useDomains } from "@/hooks/useDomains";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Domain {
  id: number;
  name: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
}

export default function DomainsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);

  const { domains, isLoading, error, refetch, deleteDomain } = useDomains();
  const { isOpen: modalOpen, open: openModal, close: closeModal } = useModal();
  const {
    isOpen: confirmOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel,
  } = useConfirm();

  const handleDeleteClick = (domain: Domain) => {
    confirm(
      "Delete Domain",
      `Are you sure you want to delete "${domain.name}"? This action cannot be undone.`,
      () => deleteDomain(domain.id)
    );
  };

  const filteredDomains = domains.filter((domain: Domain) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Domains</h1>
        <Button onClick={openModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => refetch()} disabled={isLoading}>
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8">Loading domains...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error: {error.message}
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No domains found
              </div>
            ) : (
              filteredDomains.map((domain: Domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{domain.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created: {domain.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(domain.status)}>
                      {domain.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDomain(domain);
                        openModal();
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <DomainModal
        open={modalOpen}
        onClose={() => {
          closeModal();
          setSelectedDomain(null);
        }}
        domain={selectedDomain}
        onDomainCreated={() => refetch()}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={config?.title || ""}
        message={config?.message || ""}
      />
    </div>
  );
}
