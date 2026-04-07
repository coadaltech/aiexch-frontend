import { Trophy } from "lucide-react";

export default function JamboPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-warm/20 to-ql-orange-from/20 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-accent-warm-light" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Jambo</h1>
        <p className="text-content-text text-base mb-2">This game is coming soon!</p>
        <p className="text-content-text-muted text-sm">
          We are working hard to bring you an exciting Jambo experience. Stay tuned for updates.
        </p>
      </div>
    </div>
  );
}
