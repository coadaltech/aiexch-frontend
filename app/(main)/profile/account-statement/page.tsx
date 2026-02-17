"use client";

import { useState } from "react";
import { ArrowLeft, Download, Calendar, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockStatements = [
  {
    id: "ST001",
    date: "2024-01-15",
    type: "Monthly Statement",
    period: "December 2023",
    openingBalance: 1250.0,
    closingBalance: 1580.5,
    totalDeposits: 500.0,
    totalWithdrawals: 200.0,
    totalBets: 850.0,
    totalWinnings: 880.5,
    status: "Available",
  },
  {
    id: "ST002",
    date: "2023-12-15",
    type: "Monthly Statement",
    period: "November 2023",
    openingBalance: 980.0,
    closingBalance: 1250.0,
    totalDeposits: 800.0,
    totalWithdrawals: 150.0,
    totalBets: 1200.0,
    totalWinnings: 820.0,
    status: "Available",
  },
];

export default function AccountStatement() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  return (
    <div className="min-h-screen w-full min-w-0">
      <div className="pb-6 sm:pb-8">
        <div className="flex items-center gap-3 sm:gap-4 py-4 sm:py-0 lg:mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">
            Account Statement
          </h1>
        </div>

        <Card className="mt-4 p-4 sm:p-6 mb-6 min-w-0">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
              <Calendar className="w-5 h-5 text-primary shrink-0" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-48 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="last3">Last 3 Months</SelectItem>
                  <SelectItem value="last6">Last 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {mockStatements.map((statement) => (
            <Card
              key={statement.id}
              className="p-4 sm:p-6 min-w-0"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 break-words">
                    {statement.type} - {statement.period}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Generated on {new Date(statement.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1 sm:flex-none">
                    Download
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-muted rounded-md min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Opening Balance
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-foreground truncate" title={`₹${statement.openingBalance.toFixed(2)}`}>
                    ₹{statement.openingBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-muted rounded-md min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Closing Balance
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-foreground truncate" title={`₹${statement.closingBalance.toFixed(2)}`}>
                    ₹{statement.closingBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-muted rounded-md min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Total Bets
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-foreground truncate" title={`₹${statement.totalBets.toFixed(2)}`}>
                    ₹{statement.totalBets.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-muted rounded-md min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Total Winnings
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-green-400 truncate" title={`₹${statement.totalWinnings.toFixed(2)}`}>
                    ₹{statement.totalWinnings.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {mockStatements.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No statements found
              </h3>
              <p className="text-muted-foreground">
                No account statements available for the selected period.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
