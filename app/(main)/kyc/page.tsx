"use client";

import {
  Shield,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Camera,
  ArrowLeft,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUpload } from "@/types";


const getStatusIcon = (status: string) => {
  switch (status) {
    case "verified":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "rejected":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "uploaded":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    default:
      return <Upload className="w-5 h-5 text-casino-secondary-text" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "uploaded":
      return "Under Review";
    default:
      return "Upload Required";
  }
};

export default function KYCPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      id: "identity",
      name: "Government ID",
      type: "Identity Document",
      status: "pending",
      required: true,
    },
    {
      id: "selfie",
      name: "Selfie with ID",
      type: "Identity Verification",
      status: "pending",
      required: true,
    },
  ]);

  const [kycStatus, setKycStatus] = useState<
    "not_started" | "in_progress" | "completed" | "rejected"
  >("not_started");

  const handleFileUpload = (documentId: string, file: File) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, file, status: "uploaded" as const }
          : doc
      )
    );
  };

  const handleRemoveFile = (documentId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, file: undefined, status: "pending" as const }
          : doc
      )
    );
  };

  const canSubmit = documents
    .filter((doc) => doc.required)
    .every((doc) => doc.status === "uploaded");

  return (
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="min-h-screen lg:bg-transparent md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 md:p-6 lg:p-0 lg:mb-6 lg:border-0">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-casino-primary-text hover:bg-casino-dark"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-casino-primary" />
            <h1 className="text-casino-primary-text font-bold text-lg lg:text-2xl">
              KYC Verification
            </h1>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* KYC Status Overview */}
          <div className="mt-4 lg:mt-0 lg:col-span-1">
            <Card className="bg-casino-dark border-casino-primary/30 p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-casino-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-casino-primary" />
                </div>
                <h2 className="text-xl font-bold text-casino-primary-text mb-2">
                  Verification Status
                </h2>
                <div className="text-casino-secondary-text text-sm">
                  Complete your KYC to unlock all features
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-casino-secondary-text text-sm">
                    Progress
                  </span>
                  <span className="text-casino-primary font-semibold">
                    {Math.round(
                      (documents.filter(
                        (doc) =>
                          doc.status === "uploaded" || doc.status === "verified"
                      ).length /
                        documents.filter((doc) => doc.required).length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-casino-dark rounded-full h-2">
                  <div
                    className="bg-casino-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (documents.filter(
                          (doc) =>
                            doc.status === "uploaded" ||
                            doc.status === "verified"
                        ).length /
                          documents.filter((doc) => doc.required).length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-casino-primary/20">
                <div className="text-sm text-casino-secondary-text">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Increased withdrawal limits</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Access to VIP features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Enhanced security</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Document Upload Section */}
          <div className="mt-4 lg:mt-0 lg:col-span-3">
            <Card className="bg-casino-dark border-casino-primary/30 p-6 mb-6">
              <h3 className="text-lg font-semibold text-casino-primary-text mb-4">
                Required Documents
              </h3>
              <div className="grid gap-4">
                {documents.map((document) => (
                  <DocumentUploadCard
                    key={document.id}
                    document={document}
                    onFileUpload={handleFileUpload}
                    onRemoveFile={handleRemoveFile}
                  />
                ))}
              </div>
            </Card>

            {/* Guidelines */}
            <Card className="bg-casino-dark border-casino-primary/30 p-6 mb-6">
              <h3 className="text-lg font-semibold text-casino-primary-text mb-4">
                Upload Guidelines
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-casino-secondary-text">
                <div>
                  <h4 className="font-medium text-casino-primary-text mb-2">
                    Document Quality
                  </h4>
                  <ul className="space-y-1">
                    <li>• High resolution images (min 300 DPI)</li>
                    <li>• All corners visible</li>
                    <li>• No glare or shadows</li>
                    <li>• Text clearly readable</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-casino-primary-text mb-2">
                    Accepted Formats
                  </h4>
                  <ul className="space-y-1">
                    <li>• JPG, PNG, PDF files</li>
                    <li>• Maximum file size: 10MB</li>
                    <li>• Documents in English or with translation</li>
                    <li>• Valid and not expired</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                disabled={!canSubmit}
                className="bg-casino-primary text-casino-inverse hover:bg-casino-primary/80 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3"
              >
                Submit for Verification
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentUploadCard({
  document,
  onFileUpload,
  onRemoveFile,
}: {
  document: DocumentUpload;
  onFileUpload: (documentId: string, file: File) => void;
  onRemoveFile: (documentId: string) => void;
}) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(document.id, file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "border-green-500/50 bg-green-500/10";
      case "rejected":
        return "border-red-500/50 bg-red-500/10";
      case "uploaded":
        return "border-yellow-500/50 bg-yellow-500/10";
      default:
        return "border-casino-primary/30";
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(document.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-casino-primary-text">
              {document.name}
            </h4>
            {document.required && (
              <span className="text-xs bg-casino-primary/20 text-casino-primary px-2 py-1 rounded">
                Required
              </span>
            )}
          </div>
          <p className="text-sm text-casino-secondary-text">{document.type}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(document.status)}
          <span className="text-sm font-medium text-casino-primary-text">
            {getStatusText(document.status)}
          </span>
        </div>
      </div>

      {document.file ? (
        <div className="flex items-center justify-between bg-casino-darker rounded-lg p-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-casino-primary" />
            <div>
              <div className="text-sm font-medium text-casino-primary-text">
                {document.file.name}
              </div>
              <div className="text-xs text-casino-secondary-text">
                {(document.file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
          <Button
            onClick={() => onRemoveFile(document.id)}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-casino-primary/30 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id={`file-${document.id}`}
          />
          <label
            htmlFor={`file-${document.id}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Camera className="w-8 h-8 text-casino-primary" />
            <div className="text-sm text-casino-primary-text font-medium">
              Click to upload or drag and drop
            </div>
            <div className="text-xs text-casino-secondary-text">
              JPG, PNG or PDF (max 10MB)
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
