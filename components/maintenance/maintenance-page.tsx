"use client";

import { MaintenancePageProps } from "@/types";
import { Wrench, Clock } from "lucide-react";

export default function MaintenancePage({ message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-casino-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-casino-primary/20 rounded-full">
            <Wrench className="h-12 w-12 text-casino-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-casino-primary-text">
            Under Maintenance
          </h1>
          <p className="text-casino-secondary-text">
            {message || "We are currently performing scheduled maintenance. Please check back soon."}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-casino-muted-text">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Expected downtime: 30 minutes</span>
        </div>
      </div>
    </div>
  );
}