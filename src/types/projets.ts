export type Projet = {
  id: number
  nom: string
  description: string | null
  missions: { id: number }[]
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