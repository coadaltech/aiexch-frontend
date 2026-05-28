"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Maximize2, Dice5 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { qtechCasinoApi } from "@/lib/api";

/**
 * QTech Game Launcher
 *
 * Requests a real-money launch URL from the backend (/qtech-casino/launch)
 * and renders it full-bleed in an iframe. The backend wires the user's
 * playerId and a fresh wallet session; QT calls back into our Common Wallet
 * endpoints for balance and bets. The game id is a QT string id
 * (e.g. "TK-froggrog"), URL-encoded in the route.
 */
export default function QtechPlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId: rawId } = use(params);
  const gameId = decodeURIComponent(rawId);
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; url: string }
    | { kind: "error"; message: string; upstream?: unknown }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (!gameId) {
      setState({ kind: "error", message: "Invalid game id" });
      return;
    }

    (async () => {
      try {
        const returnUrl =
          typeof window !== "undefined" ? `${window.location.origin}/qtech-casino` : undefined;
        const res = await qtechCasinoApi.launch(gameId, { returnUrl });
        if (cancelled) return;
        if (!res.data?.success || !res.data?.url) {
          setState({ kind: "error", message: "Launch URL was not returned", upstream: res.data });
          return;
        }
        setState({ kind: "ready", url: res.data.url });
      } catch (err: any) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ?? err?.message ?? "Failed to launch game";
        setState({ kind: "error", message: msg, upstream: err?.response?.data });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const goFullscreen = () => iframeRef.current?.requestFullscreen?.();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b1020]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[var(--header-primary)] px-3 py-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push("/qtech-casino")}
          className="h-8 gap-1 text-white hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Lobby
        </Button>

        <div className="flex min-w-0 items-center gap-2 text-white">
          <Dice5 className="h-4 w-4 shrink-0 text-[#ede105]" />
          <span className="truncate text-sm font-semibold" title={gameId}>
            {gameId}
          </span>
          <span className="rounded bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase">
            Real
          </span>
        </div>

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
                onClick={() => router.push("/qtech-casino")}
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
            title={gameId}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; payment; clipboard-write; encrypted-media"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
