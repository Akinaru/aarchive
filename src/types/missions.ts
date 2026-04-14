export type Mission = {
  id: number
  titre: string
  description: string | null
  statut: "EN_COURS" | "TERMINEE" | "EN_ATTENTE" | "ANNULEE"
  projetId: number
  tjm: number | null
  dateDebut: Date | null
  dureePrevueMinutes: number | null
  requiredDailyMinutes: number | null
  image?: string | null
  projet: {
    id?: number
    nom: string
    moyensPaiement?: {
      id: number
      projetId: number
      moyenPaiementId: number
      moyenPaiement: {
        id: number
        nom: string
        type: "CRYPTO" | "BANCAIRE"
        cryptoSymbol?: string | null
        cryptoNetwork?: string | null
        bankAccountHolder?: string | null
        bankIban?: string | null
      }
    }[]
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
