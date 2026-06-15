import CasinoLobby from "@/components/casino/casino-lobby";

// The casino lobby lives at /casino. Category-filtered views share the same
// component via /casino/category/[category]; see that route.
export default function CasinoPage() {
  return <CasinoLobby />;
}
