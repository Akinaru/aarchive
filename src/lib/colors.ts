// lib/colors.ts
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
 * Génère une couleur stable pour un type de tâche donné,
 * basé sur une liste triée alphabétiquement.
 */
export function getColorForTypeTache(
  nom: string,
  allTypes: string[]
): string {
  const sorted = [...allTypes].sort((a, b) => a.localeCompare(b))
  const index = sorted.indexOf(nom)
  return `var(${COLOR_VARS[index % COLOR_VARS.length]})`
}