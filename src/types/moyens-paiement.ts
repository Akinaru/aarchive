export type TypeMoyenPaiement = "CRYPTO" | "BANCAIRE"

export type MoyenPaiement = {
  id: number
  nom: string
  type: TypeMoyenPaiement
  cryptoSymbol: string | null
  cryptoNetwork: string | null
  bankAccountHolder: string | null
  bankIban: string | null
  createdAt: string
  updatedAt: string
}
