export type Mission = {
  id: number
  titre: string
  description: string | null
  statut: "EN_COURS" | "TERMINEE" | "EN_ATTENTE" | "ANNULEE"
  prixEstime: number
  prixReel: number | null
  projetId: number
  projet: { nom: string }
}
