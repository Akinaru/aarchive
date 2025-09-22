"use client"

import * as React from "react"
import Image from "next/image"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

type Profile = {
  username: string
  email: string
  country: string
}

type Prefs = {
  newsletter: boolean
  publicProfile: boolean
  theme: "theme-cosmic" | "theme-mint"
}

export default function ProfilePage() {
  const [avatarUrl, setAvatarUrl] = React.useState<string>("")
  const [profile, setProfile] = React.useState<Profile>({
    username: "akinaru",
    email: "maxime@gallotta.fr",
    country: "FR",
  })
  const [prefs, setPrefs] = React.useState<Prefs>({
    newsletter: true,
    publicProfile: true,
    theme:
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("theme-mint")
        ? "theme-mint"
        : "theme-cosmic",
  })
  const [pwd, setPwd] = React.useState({ current: "", next: "", confirm: "" })

  function handleAvatarFile(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    console.log("SAVE PROFILE", profile)
    // TODO: call API
  }

  function savePrefs(e: React.FormEvent) {
    e.preventDefault()
    const html = document.documentElement
    html.classList.remove("theme-cosmic", "theme-mint")
    html.classList.add(prefs.theme)
    localStorage.setItem("aarchive-theme", JSON.stringify(prefs.theme))
    console.log("SAVE PREFS", prefs)
  }

  function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!pwd.next || pwd.next !== pwd.confirm) {
      alert("Les mots de passe ne correspondent pas.")
      return
    }
    console.log("CHANGE PASSWORD", pwd)
    // TODO: call API
    setPwd({ current: "", next: "", confirm: "" })
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Mon profil"
        subtitle="Gère tes informations, préférences et sécurité."
        breadcrumb={[{ label: "Mon profil" }]}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        {/* === PROFIL : une seule carte === */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <form onSubmit={saveProfile}>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Avatar + informations publiques.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar (inline) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt="avatar" />
                      ) : (
                        <AvatarImage src="/avatar-placeholder.png" alt="avatar" />
                      )}
                      <AvatarFallback className="text-lg">M</AvatarFallback>
                    </Avatar>
                    <div className="text-sm text-muted-foreground">
                      <p>PNG/JPG/GIF &middot; 2 Mo max</p>
                      <p>256×256 recommandé</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="max-w-[260px]"
                      onChange={(e) => handleAvatarFile(e.currentTarget.files?.[0])}
                    />
                    <Button type="button" variant="secondary" onClick={() => setAvatarUrl("")}>
                      Réinitialiser
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Infos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d’utilisateur</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      placeholder="ton_pseudo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="toi@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <Select
                      value={profile.country}
                      onValueChange={(v) => setProfile({ ...profile, country: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionne un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => console.log("CANCEL PROFILE")}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* === PRÉFÉRENCES : une seule carte === */}
        <TabsContent value="preferences" className="mt-4">
          <Card>
            <form onSubmit={savePrefs}>
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
                <CardDescription>Apparence, confidentialité et thème.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Profil public</Label>
                    <p className="text-sm text-muted-foreground">
                      Affiche ton profil aux autres utilisateurs.
                    </p>
                  </div>
                  <Switch
                    checked={prefs.publicProfile}
                    onCheckedChange={(v) => setPrefs({ ...prefs, publicProfile: v })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Newsletter</Label>
                    <p className="text-sm text-muted-foreground">
                      Reçois les nouveautés produit.
                    </p>
                  </div>
                  <Switch
                    checked={prefs.newsletter}
                    onCheckedChange={(v) => setPrefs({ ...prefs, newsletter: v })}
                  />
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label>Thème</Label>
                  <Select
                    value={prefs.theme}
                    onValueChange={(v: "theme-cosmic" | "theme-mint") =>
                      setPrefs({ ...prefs, theme: v })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue placeholder="Choisir un thème" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theme-cosmic">Cosmic</SelectItem>
                      <SelectItem value="theme-mint">Mint</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Le thème est sauvegardé et réappliqué au prochain chargement.
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span>Mode sombre</span>
                  <Switch
                    checked={
                      typeof document !== "undefined" &&
                      document.documentElement.classList.contains("dark")
                    }
                    onCheckedChange={(on) => {
                      const html = document.documentElement
                      html.classList.toggle("dark", on)
                      localStorage.setItem("aarchive-dark", JSON.stringify(on))
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit">Enregistrer les préférences</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* === SÉCURITÉ : une seule carte === */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>Mot de passe & sessions actives.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mot de passe */}
              <form onSubmit={changePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pwd-current">Mot de passe actuel</Label>
                  <Input
                    id="pwd-current"
                    type="password"
                    autoComplete="current-password"
                    value={pwd.current}
                    onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pwd-new">Nouveau mot de passe</Label>
                    <Input
                      id="pwd-new"
                      type="password"
                      autoComplete="new-password"
                      value={pwd.next}
                      onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pwd-confirm">Confirmer</Label>
                    <Input
                      id="pwd-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={pwd.confirm}
                      onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPwd({ current: "", next: "", confirm: "" })}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">Mettre à jour</Button>
                </div>
              </form>

              <Separator />

              {/* Sessions & connexions */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Sessions & connexions</h3>
                <DeviceItem name="MacBook Pro" detail="Chrome 140 · Paris · il y a 2 h" active />
                <Separator />
                <DeviceItem name="iPhone 15" detail="Safari iOS · Lyon · il y a 3 j" />
                <Separator />
                <DeviceItem name="PC Bureau" detail="Edge · Annecy · il y a 2 sem." />
                <div className="flex justify-between">
                  <Button variant="secondary">Déconnecter l’appareil actif</Button>
                  <Button variant="destructive">Déconnecter tous les appareils</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DeviceItem({
  name,
  detail,
  active = false,
}: {
  name: string
  detail: string
  active?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
        <Image src="/device-generic.svg" alt="" width={40} height={40} className="object-cover" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          {active && <Badge className="h-5">Actif</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <Button variant="ghost" size="sm">Déconnecter</Button>
    </div>
  )
}
