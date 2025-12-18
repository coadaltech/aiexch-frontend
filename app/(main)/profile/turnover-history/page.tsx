"use client";

import { useState } from "react";
import { ArrowLeft, TrendingUp, Calendar, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { GenericProfileSkeleton } from "@/components/skeletons/profile-skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const mockTurnoverData = [
  {
    id: "TO001",
    date: "2024-01-15",
    gameType: "Casino",
    gameName: "Blackjack Pro",
    turnover: 2500.0,
    commission: 25.0,
    netResult: 150.0,
    status: "Completed",
  },
  {
    id: "TO002",
    date: "2024-01-14",
    gameType: "Sports",
    gameName: "Cricket Match",
    turnover: 1200.0,
    commission: 12.0,
    netResult: -200.0,
    status: "Completed",
  },
  {
    id: "TO003",
    date: "2024-01-13",
    gameType: "Live Casino",
    gameName: "Live Roulette",
    turnover: 800.0,
    commission: 8.0,
    netResult: 75.0,
    status: "Completed",
  },
];

export default function TurnoverHistory() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedGameType, setSelectedGameType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <GenericProfileSkeleton />;
  }

  const totalTurnover = mockTurnoverData.reduce(
    (sum, item) => sum + item.turnover,
    0
  );
  const totalCommission = mockTurnoverData.reduce(
    (sum, item) => sum + item.commission,
    0
  );
  const totalNetResult = mockTurnoverData.reduce(
    (sum, item) => sum + item.netResult,
    0
  );

  return (
    <div className="min-h-screen md:pb-8">
      <div className="max-w-6xl mx-auto md:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Turnover History
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">
                Total Turnover
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${totalTurnover.toFixed(2)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-muted-foreground text-sm">
                Total Commission
              </span>
            </div>
            <div className="text-2xl font-bold text-primary">
              ${totalCommission.toFixed(2)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-muted-foreground text-sm">
                Net Result
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${
                totalNetResult >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              ${totalNetResult.toFixed(2)}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-primary" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-primary" />
              <Select value={selectedGameType} onValueChange={setSelectedGameType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="casino">Casino</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="live-casino">Live Casino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Turnover Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-foreground font-semibold">
                    Date
                  </th>
                  <th className="text-left p-4 text-foreground font-semibold">
                    Game Type
                  </th>
                  <th className="text-left p-4 text-foreground font-semibold">
                    Game Name
                  </th>
                  <th className="text-right p-4 text-foreground font-semibold">
                    Turnover
                  </th>
                  <th className="text-right p-4 text-foreground font-semibold">
                    Commission
                  </th>
                  <th className="text-right p-4 text-foreground font-semibold">
                    Net Result
                  </th>
                  <th className="text-center p-4 text-foreground font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTurnoverData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={
                      index % 2 === 0
                        ? "bg-background"
                        : "bg-muted/50"
                    }
                  >
                    <td className="p-4 text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {item.gameType}
                      </Badge>
                    </td>
                    <td className="p-4 text-foreground">
                      {item.gameName}
                    </td>
                    <td className="p-4 text-right text-foreground font-semibold">
                      ${item.turnover.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-primary">
                      ${item.commission.toFixed(2)}
                    </td>
                    <td
                      className={`p-4 text-right font-semibold ${
                        item.netResult >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      ${item.netResult.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge className="bg-green-500/20 text-green-400">
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Empty State */}
        {mockTurnoverData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              No turnover data available for the selected filters.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
