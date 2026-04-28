"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBetSlip } from "@/contexts/BetSlipContext";
import {
  useBetting,
  useMyBets,
  useMarketExposure,
  useFancyMarketExposure,
} from "@/hooks/useBetting";
import { useStakeSettings, useLedger } from "@/hooks/useUserQueries";
import { useMultimarkets, type MultimarketPin } from "@/hooks/useMultimarkets";
import { useLiveMultimarket } from "@/hooks/useLiveMultimarket";
import { addDemoBets, type DemoBet } from "@/lib/demo-bets";
import {
  toBettingType,
  toDecimalOdds,
  toDecimalfancyOdds,
  type QuickBetData,
  type RunnerSummary,
} from "@/components/sports/quick-bet-panel";
import { MarketCard } from "@/components/sports/market-card";

// ── Helpers ──────────────────────────────────────────────────────────────
function buildAllRunners(
  market: any,
  clickedRunner: any,
  clickedPrice: number,
): RunnerSummary[] {
  const convertOdds = market.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
  if (market.bettingType === "LINE") {
    return [
      {
        id: clickedRunner.selectionId?.toString() ?? "",
        name: clickedRunner.name || "",
        price: clickedPrice,
      },
    ];
  }
  return (market.runners || []).map((r: any) => {
    const isClicked = r.selectionId === clickedRunner.selectionId;
    const rawPrice = parseFloat(r.back?.[0]?.price || r.lay?.[0]?.price || "0");
    const price = isClicked
      ? clickedPrice
      : convertOdds(rawPrice, market.provider, market.marketType);
    return {
      id: r.selectionId?.toString() ?? "",
      name: r.name || "",
      price,
    };
  });
}

export default function MultimarketPage() {
  const { user, isLoggedIn, updateDemoBalance } = useAuth();
  const { addToBetSlip } = useBetSlip();
  const queryClient = useQueryClient();
  const { placeBetAsync } = useBetting();
  useMyBets("matched");
  const { data: marketExposureMap } = useMarketExposure();
  const { data: fancyExposureMap } = useFancyMarketExposure();
  const { data: ledger } = useLedger();
  const { data: customStakes } = useStakeSettings(!!user && !user.isDemo);
  const { pins, isLoading, remove } = useMultimarkets();

  const [quickBet, setQuickBet] = useState<QuickBetData | null>(null);
  const [quickBetStake, setQuickBetStake] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [betDelayRemaining, setBetDelayRemaining] = useState(0);
  const betDelayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const betDelayResolveRef = useRef<(() => void) | null>(null);

  const liveItems = useMemo(
    () =>
      pins.map((p: MultimarketPin) => ({
        eventId: String(p.eventId),
        marketId: p.marketId,
      })),
    [pins],
  );
  const { oddsByMarketId } = useLiveMultimarket(liveItems);

  // ── Bet-delay cancel ──────────────────────────────────────────────────
  const cancelBetDelay = useCallback(() => {
    if (betDelayTimerRef.current) {
      clearInterval(betDelayTimerRef.current);
      betDelayTimerRef.current = null;
    }
    setBetDelayRemaining(0);
    betDelayResolveRef.current = null;
    setIsPlacing(false);
  }, []);

  useEffect(() => {
    if (!quickBet) return;
    const liveMarket = oddsByMarketId[quickBet.marketId];
    if (!liveMarket) return;
    if (liveMarket.status === "SUSPENDED" || liveMarket.sportingEvent) {
      const reason = liveMarket.status === "SUSPENDED" ? "market suspended" : "ball running";
      cancelBetDelay();
      setQuickBet(null);
      setQuickBetStake("");
      toast.error(`Bet panel closed — ${reason}`);
    }
  }, [oddsByMarketId, quickBet, cancelBetDelay]);

  useEffect(() => {
    if (!quickBet || isPlacing) return;
    const timer = setTimeout(() => {
      setQuickBet(null);
      setQuickBetStake("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [quickBet, quickBetStake, isPlacing]);

  // Preview exposure — projects per-runner P&L if the current quick bet were placed.
  const previewExposure = useMemo(() => {
    if (!quickBet) return null;
    const stakeNum = parseFloat(quickBetStake) || 0;
    if (stakeNum <= 0) return null;
    if (quickBet.bettingType === "LINE") return null;

    const { isLay, allRunners, runner, marketId } = quickBet;
    const rawOddsNum = parseFloat(quickBet.odds) || 0;
    if (rawOddsNum <= 0) return null;

    const isBetfairMarket = quickBet.market?.provider?.toUpperCase() === "BETFAIR";
    const isWinningOdds = quickBet.market?.marketType?.toUpperCase() === "WINNING_ODDS";
    const oddsNum = quickBet.isRawOdds
      ? toDecimalOdds(rawOddsNum, quickBet.market?.provider, quickBet.market?.marketType)
      : rawOddsNum;
    const profitMultiplier = isBetfairMarket || isWinningOdds ? oddsNum - 1 : oddsNum;

    const selectedId = runner.selectionId?.toString() ?? "";
    const existingMarket = marketExposureMap?.get(String(marketId));

    const map = new Map<string, number>();
    for (const r of allRunners) {
      const existing = existingMarket?.get(r.id) ?? 0;
      const betPnl = isLay
        ? r.id === selectedId
          ? -(stakeNum * profitMultiplier)
          : stakeNum
        : r.id === selectedId
          ? stakeNum * profitMultiplier
          : -stakeNum;
      map.set(r.id, existing + betPnl);
    }
    return { marketId: String(marketId), runners: map };
  }, [quickBet, quickBetStake, marketExposureMap]);

  // Live price for the open panel
  const liveQuickBetOdds = useMemo(() => {
    if (!quickBet) return undefined;
    const liveMarket = oddsByMarketId[quickBet.marketId];
    if (!liveMarket) return undefined;
    const liveRunner = liveMarket.runners?.find(
      (r: any) => r.selectionId?.toString() === quickBet.runner.selectionId?.toString(),
    );
    if (!liveRunner) return undefined;
    const prices = quickBet.isLay ? liveRunner.lay : liveRunner.back;
    if (!prices?.length) return undefined;
    const item = prices[quickBet.priceIndex];
    if (!item) return undefined;
    const rawPrice = item?.price ?? item?.[0] ?? null;
    if (rawPrice == null) return undefined;
    if (quickBet.isRawOdds) return String(parseFloat(String(rawPrice)));
    const convertOdds = quickBet.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
    return String(
      convertOdds(parseFloat(String(rawPrice)), quickBet.market?.provider, quickBet.market?.marketType),
    );
  }, [oddsByMarketId, quickBet]);

  // Live "run" (line value) for fancy/LINE markets so the quick-bet panel's
  // displayed line updates in real-time alongside the price.
  const liveQuickBetRun = useMemo(() => {
    if (!quickBet || quickBet.bettingType !== "LINE") return undefined;
    const liveMarket = oddsByMarketId[quickBet.marketId];
    if (!liveMarket) return undefined;
    const liveRunner = liveMarket.runners?.find(
      (r: any) => r.selectionId?.toString() === quickBet.runner.selectionId?.toString(),
    );
    if (!liveRunner) return undefined;
    const prices = quickBet.isLay ? liveRunner.lay : liveRunner.back;
    if (!prices?.length) return undefined;
    const item = prices[quickBet.priceIndex];
    if (!item) return undefined;
    const lineVal = item?.line ?? item?.price ?? null;
    if (lineVal == null) return undefined;
    return String(lineVal);
  }, [oddsByMarketId, quickBet]);

  const getLivePrice = useCallback(
    (
      marketId: string,
      selectionId: string,
      isLay: boolean,
      priceIndex = 0,
      isRaw = false,
    ): string | null => {
      const liveMarket = oddsByMarketId[marketId];
      if (!liveMarket) return null;
      const liveRunner = liveMarket.runners?.find(
        (r: any) => r.selectionId?.toString() === selectionId,
      );
      if (!liveRunner) return null;
      const prices = isLay ? liveRunner.lay : liveRunner.back;
      if (!prices || prices.length === 0) return null;
      const item = prices[priceIndex];
      if (!item) return null;
      const rawPrice = item?.price ?? item?.[0] ?? null;
      if (rawPrice == null) return null;
      if (isRaw) return String(parseFloat(String(rawPrice)));
      const convertOdds = liveMarket.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
      return String(
        convertOdds(parseFloat(String(rawPrice)), liveMarket.provider, liveMarket.marketType),
      );
    },
    [oddsByMarketId],
  );

  const isMarketBlocked = useCallback(
    (marketId: string): { blocked: boolean; reason: string } => {
      const liveMarket = oddsByMarketId[marketId];
      if (!liveMarket) return { blocked: false, reason: "" };
      if (liveMarket.status === "SUSPENDED") return { blocked: true, reason: "Market is suspended" };
      if (liveMarket.sportingEvent) return { blocked: true, reason: "Ball is running" };
      return { blocked: false, reason: "" };
    },
    [oddsByMarketId],
  );

  // ── Click handlers — signature matches shared MarketCard ────────────
  // We look up the pin for this market to carry its matchId/seriesId/eventTypeId.
  const pinByMarketId = useMemo(() => {
    const map = new Map<string, MultimarketPin>();
    for (const p of pins) map.set(p.marketId, p);
    return map;
  }, [pins]);

  const handleBackClick = useCallback(
    (
      market: any,
      runner: any,
      odds: number,
      run: string | null,
      priceIndex: number,
      isRawOdds: boolean,
    ) => {
      if (!market) return;
      if (odds === 0) return;
      const pin = pinByMarketId.get(market.marketId);
      if (!pin) return;
      const mktStatus = isMarketBlocked(market.marketId);
      if (mktStatus.blocked) {
        toast.error(mktStatus.reason);
        return;
      }
      setQuickBetStake("");
      setQuickBet({
        marketId: market.marketId,
        bettingType: market.bettingType,
        market,
        runner,
        allRunners: buildAllRunners(market, runner, odds),
        eventName: pin.eventName,
        odds: String(odds),
        run,
        isLay: false,
        priceIndex,
        isRawOdds,
        matchId: String(pin.eventId),
        seriesId: String(pin.competitionId),
        eventTypeId: String(pin.sportId),
      });
    },
    [isMarketBlocked, pinByMarketId],
  );

  const handleLayClick = useCallback(
    (
      market: any,
      runner: any,
      odds: number,
      run: string | null,
      priceIndex: number,
      isRawOdds: boolean,
    ) => {
      if (!market) return;
      if (odds === 0) return;
      const pin = pinByMarketId.get(market.marketId);
      if (!pin) return;
      const mktStatus = isMarketBlocked(market.marketId);
      if (mktStatus.blocked) {
        toast.error(mktStatus.reason);
        return;
      }
      setQuickBetStake("");
      setQuickBet({
        marketId: market.marketId,
        bettingType: market.bettingType,
        market,
        runner,
        allRunners: buildAllRunners(market, runner, odds),
        eventName: pin.eventName,
        odds: String(odds),
        run,
        isLay: true,
        priceIndex,
        isRawOdds,
        matchId: String(pin.eventId),
        seriesId: String(pin.competitionId),
        eventTypeId: String(pin.sportId),
      });
    },
    [isMarketBlocked, pinByMarketId],
  );

  const handleQuickBetClose = useCallback(() => {
    cancelBetDelay();
    setQuickBet(null);
    setQuickBetStake("");
  }, [cancelBetDelay]);

  // ── Bet placement ─────────────────────────────────────────────────────
  const executeBetPlacement = useCallback(
    async (qb: QuickBetData, stakeStr: string, oddsValue: string) => {
      const { market, runner, isLay, matchId, seriesId, eventTypeId } = qb;

      const liveMarket = oddsByMarketId[market.marketId];
      if (liveMarket) {
        if (liveMarket.status === "SUSPENDED") {
          toast.error("Bet cancelled — market is suspended");
          return;
        }
        if (liveMarket.sportingEvent) {
          toast.error("Bet cancelled — ball is running");
          return;
        }
      }

      const selId = runner.selectionId?.toString() ?? "";
      const currentPrice = getLivePrice(market.marketId, selId, isLay, qb.priceIndex, qb.isRawOdds);
      if (currentPrice !== null && currentPrice !== oddsValue) {
        toast.error(`Bet cancelled — price changed from ${oddsValue} to ${currentPrice}`);
        return;
      }

      // Read the live "line" value for fancy/LINE markets so the backend
      // receives the line currently displayed in the panel, not the stale
      // click-time value. (qb.run is frozen at click time.)
      const liveRunValue = (() => {
        if (market.bettingType !== "LINE") return qb.run;
        const lr = liveMarket?.runners?.find((r: any) => r.selectionId?.toString() === selId);
        const slot = (isLay ? lr?.lay : lr?.back)?.[qb.priceIndex];
        const lv = slot?.line ?? slot?.price ?? null;
        return lv != null ? String(lv) : qb.run;
      })();

      const marketName = market?.marketName || "";
      const runnerName = runner?.name || "";
      const stakeNum = parseFloat(stakeStr);
      const oddsNum = parseFloat(oddsValue) || 0;

      const convertOdds = market.bettingType === "LINE" ? toDecimalfancyOdds : toDecimalOdds;
      const selectedOddsConverted = qb.isRawOdds
        ? convertOdds(oddsNum, market.provider, market.marketType)
        : oddsNum;
      const allRunners: RunnerSummary[] =
        market.bettingType === "LINE"
          ? [{ id: selId, name: runner.name || "", price: oddsNum }]
          : (liveMarket ?? market).runners?.map((r: any) => {
              const isSelected = r.selectionId?.toString() === selId;
              const rawPrice = parseFloat(
                isLay
                  ? r.lay?.[0]?.price || r.back?.[0]?.price || "0"
                  : r.back?.[0]?.price || r.lay?.[0]?.price || "0",
              );
              return {
                id: r.selectionId?.toString() ?? "",
                name: r.name || "",
                price: isSelected
                  ? selectedOddsConverted
                  : convertOdds(rawPrice, market.provider, market.marketType),
              };
            }) ?? qb.allRunners;

      const marketType = toBettingType(market.bettingType);
      const potentialWin = (stakeNum * selectedOddsConverted).toFixed(2);

      const betPayload = {
        id: `slip-${Date.now()}-${market?.marketId ?? ""}-${runner?.selectionId ?? ""}`,
        teams: `${qb.eventName} - ${runnerName}`,
        market: isLay ? `LAY ${marketName}` : marketName,
        odds: oddsValue,
        stake: stakeStr,
        potentialWin,
        matchId: matchId ?? "",
        marketId: market.marketId,
        selectionId: runner.selectionId?.toString() ?? "",
        marketName,
        runnerName,
        type: (isLay ? "lay" : "back") as "back" | "lay",
        eventTypeId,
      };
      addToBetSlip(betPayload);

      if (user?.isDemo) {
        const demoBet: DemoBet = {
          id: `demo-${betPayload.id}`,
          type: isLay ? "lay" : "back",
          status: "pending",
          stake: stakeNum,
          odds: oddsNum,
          marketName,
          runnerName,
          potentialWin: stakeNum * oddsNum,
          addedDate: new Date().toISOString(),
          matchId: matchId ?? "",
          marketId: market.marketId,
          selectionId: runner.selectionId?.toString(),
        };
        addDemoBets([demoBet]);
        const userBalance = parseFloat(user?.balance || "0");
        updateDemoBalance((userBalance - stakeNum).toFixed(2));
        queryClient.invalidateQueries({ queryKey: ["my-bets"] });
        toast.success("Bet placed. Balance updated.");
      } else {
        try {
          const dbOddsNum = qb.isRawOdds
            ? toDecimalOdds(oddsNum, market?.provider, market?.marketType)
            : oddsNum;
          await placeBetAsync({
            matchId: matchId ?? "",
            marketId: market.marketId,
            eventTypeId: eventTypeId || "4",
            competitionId: seriesId ?? "",
            marketType: market.marketType || marketType,
            bettingType: marketType,
            selectionId: runner.selectionId?.toString() ?? "",
            selectionName: runnerName,
            marketName,
            odds: dbOddsNum,
            stake: stakeNum,
            run: liveRunValue != null ? parseFloat(liveRunValue) : null,
            type: isLay ? "lay" : "back",
            runners: allRunners,
            provider: market.provider,
            priceIndex: qb.priceIndex,
          });
          toast.success("Bet placed.");
        } catch (err: unknown) {
          const axiosErr = err as {
            response?: { status?: number; data?: { error?: string; message?: string } };
            message?: string;
          };
          const errStatus = axiosErr.response?.status;
          const rawMessage =
            axiosErr.response?.data?.error ||
            axiosErr.response?.data?.message ||
            (err instanceof Error ? err.message : "Failed to place bet");

          let friendlyMessage = rawMessage;
          if (rawMessage && rawMessage.includes("Bet rejected")) {
            if (rawMessage.includes("minimum bet")) {
              const m = rawMessage.match(/minimum bet is ([\d.]+)/);
              friendlyMessage = m
                ? `Minimum bet for this market is ₹${m[1]}`
                : "Stake is below the minimum bet for this market.";
            } else if (rawMessage.includes("maximum bet")) {
              const m = rawMessage.match(/maximum bet is ([\d.]+)/);
              friendlyMessage = m
                ? `Maximum bet for this market is ₹${m[1]}`
                : "Stake exceeds the maximum bet for this market.";
            } else if (rawMessage.includes("no available limit")) {
              friendlyMessage = "You have no available limit to place this bet.";
            } else if (rawMessage.includes("exceeds your available limit")) {
              friendlyMessage = "Insufficient limit to place this bet.";
            } else {
              friendlyMessage = rawMessage.replace("Bet rejected: ", "");
            }
          } else if (!rawMessage || (errStatus && errStatus >= 500)) {
            friendlyMessage = "Failed to place bet. Please try again.";
          }
          toast.error(friendlyMessage);
        }
      }
    },
    [oddsByMarketId, getLivePrice, user, addToBetSlip, placeBetAsync, queryClient, updateDemoBalance],
  );

  const handleQuickBetPlace = useCallback(
    async (stake: string, odds: string) => {
      if (!quickBet || !stake || parseFloat(stake) <= 0) return;
      const { market, runner, isLay } = quickBet;
      const oddsValue = odds || quickBet.odds;
      const stakeNum = parseFloat(stake);

      const preCheck = isMarketBlocked(market.marketId);
      if (preCheck.blocked) {
        toast.error(`Cannot place bet — ${preCheck.reason}`);
        handleQuickBetClose();
        return;
      }

      const livePriceNow = getLivePrice(
        market.marketId,
        runner.selectionId?.toString() ?? "",
        isLay,
        quickBet.priceIndex,
        quickBet.isRawOdds,
      );
      if (livePriceNow !== null && livePriceNow !== oddsValue) {
        toast.error(`Price changed from ${oddsValue} to ${livePriceNow}. Please try again.`);
        handleQuickBetClose();
        return;
      }

      const minBet = parseFloat(market?.marketCondition?.minBet) || 0;
      const maxBet = parseFloat(market?.marketCondition?.maxBet) || 0;
      if (minBet > 0 && stakeNum < minBet) {
        toast.error(`Minimum bet is ${minBet}`);
        return;
      }
      if (maxBet > 0 && stakeNum > maxBet) {
        toast.error(`Maximum bet is ${maxBet}`);
        return;
      }

      {
        const finalLimit = parseFloat(ledger?.finalLimit ?? "0");
        const oddsNum = parseFloat(odds || quickBet.odds) || 0;
        const { allRunners } = quickBet;
        const selectedId = runner.selectionId?.toString() ?? "";
        const existingMarket = marketExposureMap?.get(String(quickBet.marketId));
        const isBetfairMkt = market?.provider?.toUpperCase() === "BETFAIR";
        const isWinningOddsMkt = market?.marketType?.toUpperCase() === "WINNING_ODDS";
        const isFancyMkt = quickBet.bettingType === "LINE";
        const calcOddsNum = quickBet.isRawOdds
          ? toDecimalOdds(oddsNum, market?.provider, market?.marketType)
          : oddsNum;
        const profitMultiplier = isFancyMkt
          ? calcOddsNum
          : isBetfairMkt || isWinningOddsMkt
            ? calcOddsNum - 1
            : calcOddsNum;
        const thisBetPnls: number[] = allRunners.map((r) =>
          isLay
            ? r.id === selectedId
              ? -(stakeNum * profitMultiplier)
              : stakeNum
            : r.id === selectedId
              ? stakeNum * profitMultiplier
              : -stakeNum,
        );
        const worstBetLoss = Math.min(...thisBetPnls);
        const wouldReject =
          (worstBetLoss < 0 && Math.abs(worstBetLoss) > finalLimit) ||
          (worstBetLoss >= 0 && stakeNum > finalLimit);

        if (wouldReject) {
          if (existingMarket) {
            const existingWorstLoss = Math.min(
              ...allRunners.map((r) => existingMarket.get(r.id) ?? 0),
            );
            const projectedWorstLoss = Math.min(
              ...allRunners.map((r, i) => (existingMarket.get(r.id) ?? 0) + thisBetPnls[i]),
            );
            const projectedNetLoss = projectedWorstLoss < 0 ? Math.abs(projectedWorstLoss) : 0;
            const reducesExposure = projectedWorstLoss > existingWorstLoss;
            const currentExposure = existingWorstLoss < 0 ? Math.abs(existingWorstLoss) : 0;
            const originalLimit = finalLimit + currentExposure;
            const withinLimit = projectedNetLoss <= originalLimit;
            if (!(reducesExposure || withinLimit)) {
              toast.error("Bet rejected — potential loss exceeds your available limit.");
              return;
            }
          } else {
            toast.error(
              worstBetLoss >= 0
                ? "Bet rejected — stake exceeds your available limit."
                : "Bet rejected — potential loss exceeds your available limit.",
            );
            return;
          }
        }
      }

      const betDelay = parseFloat(market?.marketCondition?.betDelay) || 0;
      setIsPlacing(true);

      if (betDelay > 0) {
        const selId = runner.selectionId?.toString() ?? "";
        const mktId = market.marketId;
        let remaining = Math.ceil(betDelay);
        setBetDelayRemaining(remaining);

        const qbSnapshot = { ...quickBet };
        const stakeSnapshot = stake;
        const oddsSnapshot = oddsValue;

        await new Promise<void>((resolve) => {
          betDelayResolveRef.current = resolve;
          betDelayTimerRef.current = setInterval(() => {
            remaining--;
            setBetDelayRemaining(remaining);

            const delayMarket = oddsByMarketId[mktId];
            if (delayMarket && (delayMarket.status === "SUSPENDED" || delayMarket.sportingEvent)) {
              if (betDelayTimerRef.current) clearInterval(betDelayTimerRef.current);
              betDelayTimerRef.current = null;
              setBetDelayRemaining(0);
              setIsPlacing(false);
              betDelayResolveRef.current = null;
              const reason = delayMarket.status === "SUSPENDED" ? "market suspended" : "ball running";
              toast.error(`Bet cancelled — ${reason}`);
              resolve();
              return;
            }

            const currentPrice = getLivePrice(mktId, selId, isLay, qbSnapshot.priceIndex);
            if (currentPrice !== null && currentPrice !== oddsSnapshot) {
              if (betDelayTimerRef.current) clearInterval(betDelayTimerRef.current);
              betDelayTimerRef.current = null;
              setBetDelayRemaining(0);
              setIsPlacing(false);
              betDelayResolveRef.current = null;
              toast.error(`Bet cancelled — price changed from ${oddsSnapshot} to ${currentPrice}`);
              resolve();
              return;
            }

            if (remaining <= 0) {
              if (betDelayTimerRef.current) clearInterval(betDelayTimerRef.current);
              betDelayTimerRef.current = null;
              setBetDelayRemaining(0);
              betDelayResolveRef.current = null;
              executeBetPlacement(qbSnapshot, stakeSnapshot, oddsSnapshot).finally(() => {
                setIsPlacing(false);
                handleQuickBetClose();
              });
              resolve();
            }
          }, 1000);
        });
        return;
      }

      await executeBetPlacement(quickBet, stake, oddsValue);
      setIsPlacing(false);
      handleQuickBetClose();
    },
    [
      quickBet,
      isMarketBlocked,
      getLivePrice,
      ledger,
      marketExposureMap,
      oddsByMarketId,
      executeBetPlacement,
      handleQuickBetClose,
    ],
  );

  // ── Unpin button rendered inside each market header ───────────────────
  const renderPinPrefix = useCallback(
    (marketId: string) => (
      <button
        type="button"
        onClick={() => remove(marketId)}
        title="Unpin market"
        className="inline-flex items-center justify-center h-5 w-5 rounded shrink-0"
      >
        <Pin className="h-3.5 w-3.5 text-white" fill="#ffffff" strokeWidth={0} />
      </button>
    ),
    [remove],
  );

  if (!isLoggedIn || !user) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-2">Multimarket</h1>
        <div className="rounded-xl bg-gradient-to-b from-[#101e50] to-[#0b1545] border border-[#1e4088]/40 py-10 text-center text-white/70">
          Log in to pin and view markets here.
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 w-full">
      {isLoading ? (
        <div className="rounded-xl bg-gradient-to-b from-[#101e50] to-[#0b1545] border border-[#1e4088]/40 py-12 text-center text-white/60 text-sm">
          Loading…
        </div>
      ) : pins.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-b from-[#101e50] to-[#0b1545] border border-[#1e4088]/40 py-12 text-center">
          <Pin className="h-8 w-8 mx-auto text-white/30 mb-2" />
          <p className="text-white/70 text-sm font-semibold">No pinned markets yet</p>
          <p className="text-white/40 text-xs mt-1">
            Open any match and tap the pin icon next to a market to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pins.map((pin) => {
            const live = oddsByMarketId[pin.marketId] ?? null;
            const title = `${pin.eventName} (${live?.marketName ?? pin.marketName})`;
            return (
              <MarketCard
                key={pin.marketId}
                market={live}
                titleOverride={title}
                fallbackName={title}
                fallbackMinBet="-"
                fallbackMaxBet="-"
                headerPrefix={renderPinPrefix(pin.marketId)}
                handleBackClick={handleBackClick}
                handleLayClick={handleLayClick}
                quickBet={quickBet}
                quickBetStake={quickBetStake}
                setQuickBetStake={setQuickBetStake}
                isPlacing={isPlacing}
                betDelayRemaining={betDelayRemaining}
                cancelBetDelay={cancelBetDelay}
                handleQuickBetClose={handleQuickBetClose}
                handleQuickBetPlace={handleQuickBetPlace}
                liveQuickBetOdds={liveQuickBetOdds}
                liveQuickBetRun={liveQuickBetRun}
                customStakes={customStakes}
                marketExposureMap={marketExposureMap}
                fancyExposureMap={fancyExposureMap}
                previewExposure={previewExposure}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
