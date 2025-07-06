export type Temps = {
  id: number
  date: string // ISO string (type Date envoyé depuis l’API)
  description: string
  dureeMinutes: number
  missionId: number
  typeTacheId: number

  mission: {
    titre: string
  }
  typeTache: {
    nom: string
  }
}
