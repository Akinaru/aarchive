export type Projet = {
  id: number
  nom: string
  description: string | null
  missions: { id: number }[]
  clients: {
    client: {
      id: number
      nom: string
      email?: string | null
    }
  }[]
}
