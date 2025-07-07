export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h${m > 0 ? `${m}min` : ""}`
  return `${m}min`
}