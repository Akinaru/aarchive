'use client'

import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type User = {
  id: string
  name?: string
  email?: string
  // Ajoute ici des champs personnalisés si besoin : role, isValidated, etc.
}

type UserContextType = {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<User | null>(session?.user || null)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
    }
  }, [session])

  const updateUser = async () => {
    const newSession = await update()
    if (newSession?.user) {
      setUser(newSession.user)
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
