"use client";

import { useInit } from "@/hooks/useCasino";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CasinoGame = () => {
  const { game } = useParams();
  const router = useRouter();
  const { mutate: init, isPending } = useInit();
  const { isLoggedIn, user } = useAuth();
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Please login to play casino games");
      router.push("/casino");
      return;
    }

    if (game) {
      init(
        {
          game_uuid: game as string,
        },
        {
          onSuccess: (response) => {
            if (response.data?.url) {
              setGameUrl(response.data.url);
            }
          },
          onError: (error) => {
            console.error(error);
          },
        }
      );
    }
  }, [game, init, isLoggedIn, router]);

  return (
    <div className=" md:h-screen h-[90vh]">
      {(isPending || !gameUrl || iframeLoading) && (
        <div className=" mt-12 flex items-center justify-center bg-background z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading game...</p>
          </div>
        </div>
      )}
      {gameUrl && (
        <iframe
          src={gameUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          onLoad={() => setIframeLoading(false)}
        />
      )}
    </div>
  );
};

export default CasinoGame;
