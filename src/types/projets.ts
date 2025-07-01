export type Projet = {
  id: number
  nom: string
  description: string | null
  missions: { id: number }[]
  clients: { client: { nom: string } }[]
}
