"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Runner {
  selectionId: number;
  selectionName: string;
}

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
  runners: Runner[];
}

// Group markets: Sport → Event → markets[]
interface EventGroup {
  eventName: string;
  matchId: number;
  competitionName: string;
  markets: UndeclaredMarket[];
}

interface SportGroup {
  sportName: string;
  eventTypeId: number;
  events: EventGroup[];
  totalMarkets: number;
}

function groupMarkets(markets: UndeclaredMarket[]): SportGroup[] {
  const sportMap = new Map<number, SportGroup>();

  for (const m of markets) {
    let sport = sportMap.get(m.eventTypeId);
    if (!sport) {
      sport = {
        sportName: m.eventTypeName,
        eventTypeId: m.eventTypeId,
        events: [],
        totalMarkets: 0,
      };
      sportMap.set(m.eventTypeId, sport);
    }

    let event = sport.events.find((e) => e.matchId === m.matchId);
    if (!event) {
      event = {
        eventName: m.eventName,
        matchId: m.matchId,
        competitionName: m.competitionName,
        markets: [],
      };
      sport.events.push(event);
    }

    event.markets.push(m);
    sport.totalMarkets++;
  }

  return Array.from(sportMap.values()).sort((a, b) =>
    a.sportName.localeCompare(b.sportName)
  );
}

const REFRESH_INTERVAL = 30; // seconds

export default function SportsResultPage() {
  const {
    data: markets = [],
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useUndeclaredMarkets();
  const checkResult = useCheckMarketResult();
  const declareResult = useDeclareMarketResult();

  const [search, setSearch] = useState("");
  const [declaring, setDeclaring] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  // Countdown timer — resets whenever data is fetched
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  // Collapsible state
  const [openSports, setOpenSports] = useState<Set<number>>(new Set());
  const [openEvents, setOpenEvents] = useState<Set<number>>(new Set());

  // Manual declare modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMarket, setModalMarket] = useState<UndeclaredMarket | null>(null);
  const [manualWinnerId, setManualWinnerId] = useState("");

  // Confirmation dialogs
  const [selectConfirmOpen, setSelectConfirmOpen] = useState(false);
  const [pendingRunner, setPendingRunner] = useState<Runner | null>(null);
  const [declareConfirmOpen, setDeclareConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return markets;
    const q = search.toLowerCase();
    return markets.filter(
      (m: UndeclaredMarket) =>
        m.eventTypeName?.toLowerCase().includes(q) ||
        m.competitionName?.toLowerCase().includes(q) ||
        m.eventName?.toLowerCase().includes(q) ||
        m.marketName?.toLowerCase().includes(q) ||
        m.marketId?.toLowerCase().includes(q)
    );
  }, [markets, search]);

  const grouped = useMemo(() => groupMarkets(filtered), [filtered]);

  // Auto-open all groups when data loads or search changes
  useEffect(() => {
    setOpenSports(new Set(grouped.map((s) => s.eventTypeId)));
    setOpenEvents(
      new Set(grouped.flatMap((s) => s.events.map((e) => e.matchId)))
    );
  }, [grouped]);

  const isFancy = (mt: number) => mt === 4;

  const toggleSport = (id: number) =>
    setOpenSports((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleEvent = (id: number) =>
    setOpenEvents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function handleDeclare(market: UndeclaredMarket) {
    setDeclaring(market.marketId);
    try {
      const result = await checkResult.mutateAsync(market.marketId);

      if (result?.status === "DECLARED" && result?.winnerId != null) {
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
      // Error toasted by hooks
    } finally {
      setDeclaring(null);
    }
  }

  // When user selects a runner from dropdown, ask to confirm selection
  function handleRunnerSelect(value: string) {
    const runner = modalMarket?.runners.find(
      (r) => String(r.selectionId) === value
    );
    if (runner) {
      setPendingRunner(runner);
      setSelectConfirmOpen(true);
    }
  }

  // After confirming runner selection, populate the input
  function confirmRunnerSelection() {
    if (pendingRunner) {
      setManualWinnerId(String(pendingRunner.selectionId));
    }
    setPendingRunner(null);
    setSelectConfirmOpen(false);
  }

  // When clicking "Declare Result" button, ask final confirmation
  function handleDeclareClick() {
    if (!modalMarket || !manualWinnerId.trim()) return;
    setDeclareConfirmOpen(true);
  }

  async function confirmAndDeclare() {
    setDeclareConfirmOpen(false);
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
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Sports Result</h1>
          <p className="text-sm text-muted-foreground">
            {markets.length} undeclared market{markets.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by sport, event, market..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            <span className="tabular-nums text-xs w-5 text-center">
              {countdown}s
            </span>
          </Button>
        </div>
      </div>

      {/* Grouped Content */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {search
            ? "No markets match your search"
            : "No undeclared markets found"}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((sport) => (
            <div
              key={sport.eventTypeId}
              className="border rounded-lg overflow-hidden"
            >
              {/* Sport Header */}
              <button
                onClick={() => toggleSport(sport.eventTypeId)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                {openSports.has(sport.eventTypeId) ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className="font-semibold text-lg">
                  {sport.sportName}
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {sport.totalMarkets} market
                  {sport.totalMarkets !== 1 && "s"}
                </Badge>
              </button>

              {/* Sport Body — Events */}
              {openSports.has(sport.eventTypeId) && (
                <div className="divide-y">
                  {sport.events.map((event) => (
                    <div key={event.matchId}>
                      {/* Event Header */}
                      <button
                        onClick={() => toggleEvent(event.matchId)}
                        className="w-full flex items-center gap-3 px-6 py-2.5 bg-background hover:bg-muted/30 transition-colors text-left border-b"
                      >
                        {openEvents.has(event.matchId) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">
                            {event.eventName}
                          </span>
                          {event.competitionName && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({event.competitionName})
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.markets.length} market
                          {event.markets.length !== 1 && "s"}
                        </Badge>
                      </button>

                      {/* Event Body — Markets Table */}
                      {openEvents.has(event.matchId) && (
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-10">
                                  Market ID
                                </TableHead>
                                <TableHead>Market Name</TableHead>
                                <TableHead>Type</TableHead>
                                {/* <TableHead>Runners</TableHead> */}
                                <TableHead className="text-right pr-4">
                                  Action
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {event.markets.map((market) => (
                                <TableRow key={market.marketId}>
                                  <TableCell className="font-mono text-xs pl-10">
                                    {market.marketId}
                                  </TableCell>
                                  <TableCell>
                                    {market.marketName || "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {MARKET_TYPE_LABELS[market.marketType] ??
                                        market.marketType}
                                    </Badge>
                                  </TableCell>
                                  {/* <TableCell>
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
                                  </TableCell> */}
                                  <TableCell className="text-right pr-4">
                                    <Button
                                      size="sm"
                                      onClick={() => handleDeclare(market)}
                                      disabled={
                                        declaring === market.marketId
                                      }
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Manual Winner ID Modal ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Result Declaration</DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Result not found from external API. Enter the winner manually.
              </span>
            </DialogDescription>
          </DialogHeader>

          {modalMarket && (
            <div className="space-y-4">
              {/* Market info */}
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
                  {MARKET_TYPE_LABELS[modalMarket.marketType] ??
                    modalMarket.marketType}
                </div>
              </div>

              {/* Runner Dropdown */}
              {modalMarket.runners?.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Winner from Runners
                  </label>
                  <Select
                    value={manualWinnerId}
                    onValueChange={handleRunnerSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a runner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {modalMarket.runners.map((r) => (
                        <SelectItem
                          key={r.selectionId}
                          value={String(r.selectionId)}
                        >
                          {r.selectionName} ({r.selectionId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Winner ID input */}
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
                    : "For Odds & Bookmaker markets, enter the winning Runner ID as Winner ID. You can also select from the dropdown above."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeclareClick}
              disabled={
                !manualWinnerId.trim() || declaring === modalMarket?.marketId
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

      {/* ─── Confirm Runner Selection Dialog ─── */}
      <AlertDialog
        open={selectConfirmOpen}
        onOpenChange={setSelectConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Runner Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to select{" "}
              <span className="font-semibold text-foreground">
                {pendingRunner?.selectionName} ({pendingRunner?.selectionId})
              </span>{" "}
              as the winner?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingRunner(null);
                setSelectConfirmOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRunnerSelection}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Final Declare Confirmation Dialog ─── */}
      <AlertDialog
        open={declareConfirmOpen}
        onOpenChange={setDeclareConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Result Declaration</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Are you sure you want to declare the result for this market?
                This action cannot be undone.
              </span>
              {modalMarket && (
                <span className="block rounded border p-2 text-sm mt-2">
                  <span className="block">
                    <span className="text-muted-foreground">Market:</span>{" "}
                    {modalMarket.marketName || modalMarket.marketId}
                  </span>
                  <span className="block">
                    <span className="text-muted-foreground">Winner ID:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {manualWinnerId}
                    </span>
                    {(() => {
                      const runner = modalMarket.runners?.find(
                        (r) => String(r.selectionId) === manualWinnerId
                      );
                      return runner ? (
                        <span className="text-foreground">
                          {" "}
                          — {runner.selectionName}
                        </span>
                      ) : null;
                    })()}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAndDeclare}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Declare Result
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
