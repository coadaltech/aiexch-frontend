"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationProps } from "./types";



export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-casino-secondary-text">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
