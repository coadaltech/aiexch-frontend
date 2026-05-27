"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Maximize2,
  Dice5,
  Wallet,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { casinoAceApi, userApi } from "@/lib/api";

/**
 * Ace Gamings Game Launcher
 *
 * Shows user balance in the toolbar (live — refreshes on window focus and
 * every 30 s while the game is open). Fills the parent <main> exactly so
 * there is no nested page scroll.
 */
export default function CasinoAcePlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; url: string; gameName: string }
    | { kind: "error"; message: string; upstream?: unknown }
  >({ kind: "loading" });

  const [balance, setBalance] = useState<string | null>(null);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

  // ── Fetch balance from our API ─────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    setBalanceRefreshing(true);
    try {
      const res = await userApi.getBalance();
      if (res.data?.balance !== undefined) {
        const num = parseFloat(res.data.balance);
        setBalance(
          isNaN(num)
            ? res.data.balance
            : num.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
        );
      }
    } catch {
      // silently ignore — balance display is non-critical
    } finally {
      setBalanceRefreshing(false);
    }
  }, []);

  // Fetch balance on mount and refresh every 30 s
  useEffect(() => {
    fetchBalance();
    const id = setInterval(fetchBalance, 30_000);
    return () => clearInterval(id);
  }, [fetchBalance]);

  // Also refresh when the user switches back to this tab (bet may have settled)
  useEffect(() => {
    const onFocus = () => fetchBalance();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchBalance]);

  // ── Launch game ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const numericId = Number(gameId);
    if (!Number.isFinite(numericId)) {
      setState({ kind: "error", message: "Invalid game id" });
      return;
    }

    (async () => {
      try {
        const returnUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/casino-ace`
            : undefined;
        const res = await casinoAceApi.launch(numericId, returnUrl);
        if (cancelled) return;
        if (!res.data?.success || !res.data?.url) {
          setState({
            kind: "error",
            message: "Launch URL was not returned",
            upstream: res.data,
          });
          return;
        }
        setState({
          kind: "ready",
          url: res.data.url,
          gameName: res.data.game?.name ?? "Casino",
        });
      } catch (err: any) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Failed to launch game";
        setState({ kind: "error", message: msg, upstream: err?.response?.data });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const goFullscreen = () => {
    iframeRef.current?.requestFullscreen?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b1020]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[var(--header-primary)] px-3 py-2">
        {/* Left — back to lobby */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push("/casino-ace")}
          className="h-8 gap-1 text-white hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Lobby</span>
        </Button>

        {/* Centre — game name + balance */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <Dice5 className="h-4 w-4 shrink-0 text-[#ede105]" />
            <span
              className="max-w-[130px] truncate text-sm font-semibold sm:max-w-none"
              title={state.kind === "ready" ? state.gameName : undefined}
            >
              {state.kind === "ready" ? state.gameName : "Loading…"}
            </span>
          </div>

          {/* Balance pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <Wallet className="h-3.5 w-3.5 text-[#ede105]" />
            <span className="text-xs font-semibold text-white">
              {balance !== null ? `₹${balance}` : "—"}
            </span>
            <button
              onClick={fetchBalance}
              disabled={balanceRefreshing}
              className="ml-0.5 text-white/50 transition-colors hover:text-white disabled:opacity-30"
              title="Refresh balance"
            >
              <RefreshCw
                className={`h-3 w-3 ${balanceRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Right — fullscreen */}
        <Button
          size="sm"
          variant="ghost"
          onClick={goFullscreen}
          disabled={state.kind !== "ready"}
          className="h-8 gap-1 text-white hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline">Fullscreen</span>
        </Button>
      </div>

      {/* Stage */}
      <div className="relative min-h-0 flex-1">
        {state.kind === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <Loader2 className="h-7 w-7 animate-spin text-[#ede105]" />
            <p className="text-sm">Preparing your game…</p>
          </div>
        )}

        {state.kind === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-white p-6 shadow-xl">
              <div className="mb-2 flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h2 className="font-semibold">Could not launch the game</h2>
              </div>
              <p className="text-sm text-gray-600">{state.message}</p>
              {state.upstream != null && (
                <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-gray-100 p-2 text-xs text-gray-700">
                  {JSON.stringify(state.upstream, null, 2)}
                </pre>
              )}
              <Button
                variant="outline"
                onClick={() => router.push("/casino-ace")}
                className="mt-4 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to lobby
              </Button>
            </div>
          </div>
        )}

        {state.kind === "ready" && (
          <iframe
            ref={iframeRef}
            src={state.url}
            title={state.gameName}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; payment; clipboard-write; encrypted-media"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
