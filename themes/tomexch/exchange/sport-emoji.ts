/** Emoji icon per sport, matching the reference rail's coloured sport icons.
 *  Shared by the TomExch nav and sidebar so a sport shows the same icon in both. */
export const SPORT_EMOJI: Record<string, string> = {
  cricket: "🏏",
  soccer: "⚽",
  football: "⚽",
  tennis: "🎾",
  "table tennis": "🏓",
  "horse racing": "🐎",
  "greyhound racing": "🐕",
  basketball: "🏀",
  boxing: "🥊",
  darts: "🎯",
  golf: "⛳",
  "mixed martial arts": "🥋",
  mma: "🥋",
  "rugby union": "🏉",
  "rugby league": "🏉",
  rugby: "🏉",
  baseball: "⚾",
  volleyball: "🏐",
  "ice hockey": "🏒",
  hockey: "🏒",
  snooker: "🎱",
  billiards: "🎱",
  badminton: "🏸",
  handball: "🤾",
  kabaddi: "🤼",
  cycling: "🚴",
  esports: "🎮",
  "e-sports": "🎮",
  "american football": "🏈",
  politics: "🏛️",
  election: "🏛️",
  futsal: "🥅",
};

export function sportEmoji(name: string): string {
  return SPORT_EMOJI[name.trim().toLowerCase()] ?? "🏆";
}
