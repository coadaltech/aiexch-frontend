"use client";

import { useState } from "react";
import { Loader2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUndeclaredMarkets,
  useCheckMarketResult,
  useDeclareMarketResult,
} from "@/hooks/useOwner";

const MARKET_TYPE_LABELS: Record<number, string> = {
  0: "Match Odds",
  1: "Tied Match",
  2: "Complete Match",
  3: "Bookmaker",
  4: "Fancy",
};

interface UndeclaredMarket {
  marketId: string;
  matchId: number;
  eventTypeId: number;
  competitionId: number | null;
  marketType: number;
  marketName: string | null;
  eventTypeName: string;
  competitionName: string;
  eventName: string;
  runners: { selectionId: number; selectionName: string }[];
}

export default function SportsResultPage() {
  const { data: markets = [], isLoading } = useUndeclaredMarkets();
  const checkResult = useCheckMarketResult();
  const declareResult = useDeclareMarketResult();

  const [search, setSearch] = useState("");
  const [declaring, setDeclaring] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMarket, setModalMarket] = useState<UndeclaredMarket | null>(null);
  const [manualWinnerId, setManualWinnerId] = useState("");

  const filtered = markets.filter((m: UndeclaredMarket) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.eventTypeName?.toLowerCase().includes(q) ||
      m.competitionName?.toLowerCase().includes(q) ||
      m.eventName?.toLowerCase().includes(q) ||
      m.marketName?.toLowerCase().includes(q) ||
      m.marketId?.toLowerCase().includes(q)
    );
  });

  const isFancy = (mt: number) => mt === 4;

  async function handleDeclare(market: UndeclaredMarket) {
    setDeclaring(market.marketId);
    try {
      // Step 1: Check result from external API
      const result = await checkResult.mutateAsync(market.marketId);

      if (
        result?.status === "DECLARED" &&
        result?.winnerId != null
      ) {
        // API returned a winner — declare directly
        await declareResult.mutateAsync({
          marketId: market.marketId,
          winnerId: result.winnerId,
          marketType: market.marketType,
          eventTypeId: market.eventTypeId,
          competitionId: market.competitionId,
          matchId: market.matchId,
          eventTypeName: market.eventTypeName,
          competitionName: market.competitionName,
          eventName: market.eventName,
          marketName: market.marketName,
        });
      } else {
        // No winner from API — open modal for manual entry
        setModalMarket(market);
        setManualWinnerId("");
        setModalOpen(true);
      }
    } catch {
      // Error already toasted by hooks
    } finally {
      setDeclaring(null);
    }
  }

  async function handleManualDeclare() {
    if (!modalMarket || !manualWinnerId.trim()) return;
    setDeclaring(modalMarket.marketId);
    try {
      await declareResult.mutateAsync({
        marketId: modalMarket.marketId,
        winnerId: manualWinnerId.trim(),
        marketType: modalMarket.marketType,
        eventTypeId: modalMarket.eventTypeId,
        competitionId: modalMarket.competitionId,
        matchId: modalMarket.matchId,
        eventTypeName: modalMarket.eventTypeName,
        competitionName: modalMarket.competitionName,
        eventName: modalMarket.eventName,
        marketName: modalMarket.marketName,
      });
      setModalOpen(false);
      setModalMarket(null);
    } catch {
      // Error toasted by hook
    } finally {
      setDeclaring(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sports Result</h1>
          <p className="text-sm text-muted-foreground">
            {markets.length} undeclared market{markets.length !== 1 && "s"}
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sport, event, market..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {search ? "No markets match your search" : "No undeclared markets found"}
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market ID</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Competition</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Market Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Runners</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((market: UndeclaredMarket) => (
                <TableRow key={market.marketId}>
                  <TableCell className="font-mono text-xs">
                    {market.marketId}
                  </TableCell>
                  <TableCell>{market.eventTypeName}</TableCell>
                  <TableCell>{market.competitionName || "—"}</TableCell>
                  <TableCell>{market.eventName}</TableCell>
                  <TableCell>{market.marketName || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {MARKET_TYPE_LABELS[market.marketType] ?? market.marketType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {market.runners?.map((r) => (
                        <Badge
                          key={r.selectionId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {r.selectionName}{" "}
                          <span className="text-muted-foreground ml-1">
                            ({r.selectionId})
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleDeclare(market)}
                      disabled={declaring === market.marketId}
                    >
                      {declaring === market.marketId ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Declare Result
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Manual Winner ID Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Result Declaration</DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                Result not found from external API. Enter the winner manually.
              </span>
            </DialogDescription>
          </DialogHeader>

          {modalMarket && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Market:</span>{" "}
                  {modalMarket.marketName || modalMarket.marketId}
                </div>
                <div>
                  <span className="text-muted-foreground">Event:</span>{" "}
                  {modalMarket.eventName}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {MARKET_TYPE_LABELS[modalMarket.marketType] ?? modalMarket.marketType}
                </div>
              </div>

              {/* Show runners for reference */}
              {modalMarket.runners?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Available Runners:</p>
                  <div className="flex flex-wrap gap-2">
                    {modalMarket.runners.map((r) => (
                      <Badge
                        key={r.selectionId}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() =>
                          setManualWinnerId(String(r.selectionId))
                        }
                      >
                        {r.selectionName} ({r.selectionId})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isFancy(modalMarket.marketType)
                    ? "Winner ID (Line / Run value)"
                    : "Winner ID (Runner ID)"}
                </label>
                <Input
                  type="text"
                  placeholder={
                    isFancy(modalMarket.marketType)
                      ? "Enter the line / run value"
                      : "Enter the winning runner ID"
                  }
                  value={manualWinnerId}
                  onChange={(e) => setManualWinnerId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {isFancy(modalMarket.marketType)
                    ? "For Line/Fancy markets, enter the run value as Winner ID."
                    : "For Odds & Bookmaker markets, enter the winning Runner ID as Winner ID."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleManualDeclare}
              disabled={
                !manualWinnerId.trim() ||
                declaring === modalMarket?.marketId
              }
            >
              {declaring === modalMarket?.marketId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Declare Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
