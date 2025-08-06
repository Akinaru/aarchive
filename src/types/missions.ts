export type Mission = {
  id: number
  titre: string
  description: string | null
  statut: "EN_COURS" | "TERMINEE" | "EN_ATTENTE" | "ANNULEE"
  projetId: number
  tjm: number | null
  dateDebut: Date | null
  dureePrevueMinutes: number | null
  projet: {
    nom: string
    clients?: {
      client: {
        id: number
        nom: string
        photoPath?: string | null
        email?: string | null
        telephone?: string | null
      }
    }[]
  }
}