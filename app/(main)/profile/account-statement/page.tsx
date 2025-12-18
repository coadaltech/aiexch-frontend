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
    <div className="min-h-screen max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        <div className="flex items-center gap-4 lg:p-0 lg:mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Account Statement
          </h1>
        </div>

        <Card className="mt-4 p-4 mb-6 lg:mx-0">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-primary" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
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
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </Card>

        <div className="space-y-4 lg:p-0">
          {mockStatements.map((statement) => (
            <Card
              key={statement.id}
              className="p-6"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {statement.type} - {statement.period}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Generated on {new Date(statement.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 mt-4 lg:mt-0">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm">
                    Download
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Opening Balance
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    ₹{statement.openingBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Closing Balance
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    ₹{statement.closingBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Total Bets
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    ₹{statement.totalBets.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Total Winnings
                  </div>
                  <div className="text-lg font-semibold text-green-400">
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
