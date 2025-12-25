export function formatSize(size: number): string {
  if (size >= 1_000_000) return Math.round(size / 1_000_000) + "M";
  if (size >= 1_000) return Math.round(size / 1_000) + "K";
  return Math.round(size).toString();
}
