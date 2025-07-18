export type Temps = {
  id: number
  date: string // ISO string (type Date envoyé depuis l’API)
  description: string
  dureeMinutes: number
  missionId: number
  typeTacheId: number
  createdAt: string

  mission: {
    id: number
    titre: string
  }
  typeTache: {
    id: number
    nom: string
  }
}
