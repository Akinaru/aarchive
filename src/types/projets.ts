export type Projet = {
  id: number
  nom: string
  description: string | null
  missions: { id: number }[]
  moyensPaiement?: {
    moyenPaiement: {
      id: number
      nom: string
      type: "CRYPTO" | "BANCAIRE"
      cryptoSymbol?: string | null
      cryptoNetwork?: string | null
      bankIban?: string | null
    }
  }[]
  clients: {
      client: {
        id: number
        nom: string
        photoPath?: string | null
        email?: string | null
        telephone?: string | null
      }
  }[]
}
