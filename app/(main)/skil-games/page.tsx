import { Trophy } from "lucide-react";

export default function SkilGamesPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Skil Games</h1>
        <p className="text-gray-400 text-base mb-2">This game is coming soon!</p>
        <p className="text-gray-500 text-sm">
          We are working hard to bring you exciting skill-based games. Stay tuned for updates.
        </p>
      </div>
    </div>
  );
}
