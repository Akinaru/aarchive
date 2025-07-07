const COLOR_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
  "--chart-9",
  "--chart-10",
]

/**
 * Hash simple pour obtenir un index stable à partir d'un string
 */
function hashStringToIndex(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash) % max
}

/**
 * Donne une couleur stable pour un type de tâche, peu importe les autres
 */
export function getColorForTypeTacheStable(nom: string): string {
  const cleaned = nom.toLowerCase().trim()
  const index = hashStringToIndex(cleaned, COLOR_VARS.length)
  const color = `var(${COLOR_VARS[index]})`

  console.log(`[Color Debug] nom: "${nom}" → cleaned: "${cleaned}" → index: ${index} → color: ${color}`)

  return color
}