"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoyenPaiement, TypeMoyenPaiement } from "@/types/moyens-paiement"

type CryptoAsset = {
  id: string
  symbol: string
  name: string
  image: string | null
}

function normalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase()
}

function isIbanFormatValid(iban: string): boolean {
  return /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)
}

export default function MoyensPaiementPage() {
  const [moyensPaiement, setMoyensPaiement] = useState<MoyenPaiement[]>([])
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([])
  const [cryptoNetworks, setCryptoNetworks] = useState<string[]>([])
  const [newCoinNetworks, setNewCoinNetworks] = useState<string[]>([])
  const [editCoinNetworks, setEditCoinNetworks] = useState<string[]>([])

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editMoyen, setEditMoyen] = useState<MoyenPaiement | null>(null)

  const [newNom, setNewNom] = useState("")
  const [newType, setNewType] = useState<TypeMoyenPaiement>("CRYPTO")
  const [newCryptoSymbol, setNewCryptoSymbol] = useState("")
  const [newCryptoSearch, setNewCryptoSearch] = useState("")
  const [newUseCryptoNetwork, setNewUseCryptoNetwork] = useState(false)
  const [newCryptoNetwork, setNewCryptoNetwork] = useState("")
  const [newNetworkSearch, setNewNetworkSearch] = useState("")
  const [newBankAccountHolder, setNewBankAccountHolder] = useState("")
  const [newBankIban, setNewBankIban] = useState("")

  const [editCryptoSearch, setEditCryptoSearch] = useState("")
  const [editUseCryptoNetwork, setEditUseCryptoNetwork] = useState(false)
  const [editNetworkSearch, setEditNetworkSearch] = useState("")

  const selectedNewAsset = useMemo(
    () => cryptoAssets.find((asset) => asset.symbol === newCryptoSymbol) ?? null,
    [cryptoAssets, newCryptoSymbol]
  )

  const selectedEditAsset = useMemo(
    () =>
      cryptoAssets.find((asset) => asset.symbol === (editMoyen?.cryptoSymbol ?? "")) ??
      null,
    [cryptoAssets, editMoyen?.cryptoSymbol]
  )

  const fetchMoyensPaiement = async () => {
    try {
      const res = await fetch("/api/moyens-paiement")
      const data = await res.json()
      setMoyensPaiement(data)
    } catch {
      toast.error("Erreur lors du chargement des moyens de paiement.")
    }
  }

  const fetchCryptoCatalog = async () => {
    try {
      const res = await fetch("/api/crypto/catalog")
      const data = await res.json()
      setCryptoAssets(Array.isArray(data.assets) ? data.assets : [])
      setCryptoNetworks(Array.isArray(data.networks) ? data.networks : [])
    } catch {
      setCryptoAssets([])
      setCryptoNetworks([])
    }
  }

  const fetchNetworksForCoin = async (coinId: string): Promise<string[]> => {
    try {
      const res = await fetch(
        `/api/crypto/networks?coinId=${encodeURIComponent(coinId)}`
      )
      const data = await res.json()
      return Array.isArray(data.networks) ? data.networks : []
    } catch {
      return []
    }
  }

  useEffect(() => {
    fetchMoyensPaiement()
    fetchCryptoCatalog()
  }, [])

  useEffect(() => {
    let cancelled = false

    if (newType !== "CRYPTO" || !selectedNewAsset?.id) {
      setNewCoinNetworks([])
      return
    }

    ;(async () => {
      const networks = await fetchNetworksForCoin(selectedNewAsset.id)
      if (!cancelled) setNewCoinNetworks(networks)
    })()

    return () => {
      cancelled = true
    }
  }, [newType, selectedNewAsset?.id])

  useEffect(() => {
    let cancelled = false

    if (editMoyen?.type !== "CRYPTO" || !selectedEditAsset?.id) {
      setEditCoinNetworks([])
      return
    }

    ;(async () => {
      const networks = await fetchNetworksForCoin(selectedEditAsset.id)
      if (!cancelled) setEditCoinNetworks(networks)
    })()

    return () => {
      cancelled = true
    }
  }, [editMoyen?.type, selectedEditAsset?.id])

  const newNetworkOptions = useMemo(
    () => (newCoinNetworks.length > 0 ? newCoinNetworks : cryptoNetworks),
    [newCoinNetworks, cryptoNetworks]
  )

  const editNetworkOptions = useMemo(
    () => (editCoinNetworks.length > 0 ? editCoinNetworks : cryptoNetworks),
    [editCoinNetworks, cryptoNetworks]
  )

  const filteredNewCryptoAssets = useMemo(() => {
    const term = newCryptoSearch.trim().toLowerCase()
    if (!term) return cryptoAssets
    return cryptoAssets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(term) ||
        asset.name.toLowerCase().includes(term)
    )
  }, [cryptoAssets, newCryptoSearch])

  const filteredEditCryptoAssets = useMemo(() => {
    const term = editCryptoSearch.trim().toLowerCase()
    if (!term) return cryptoAssets
    return cryptoAssets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(term) ||
        asset.name.toLowerCase().includes(term)
    )
  }, [cryptoAssets, editCryptoSearch])

  const filteredNewNetworks = useMemo(() => {
    const term = newNetworkSearch.trim().toLowerCase()
    if (!term) return newNetworkOptions
    return newNetworkOptions.filter((network) =>
      network.toLowerCase().includes(term)
    )
  }, [newNetworkOptions, newNetworkSearch])

  const filteredEditNetworks = useMemo(() => {
    const term = editNetworkSearch.trim().toLowerCase()
    if (!term) return editNetworkOptions
    return editNetworkOptions.filter((network) =>
      network.toLowerCase().includes(term)
    )
  }, [editNetworkOptions, editNetworkSearch])

  const resetNewForm = () => {
    setNewNom("")
    setNewType("CRYPTO")
    setNewCryptoSymbol("")
    setNewCryptoSearch("")
    setNewUseCryptoNetwork(false)
    setNewCryptoNetwork("")
    setNewNetworkSearch("")
    setNewCoinNetworks([])
    setNewBankAccountHolder("")
    setNewBankIban("")
  }

  const validatePayload = (
    type: TypeMoyenPaiement,
    cryptoSymbol: string,
    useCryptoNetwork: boolean,
    cryptoNetwork: string,
    bankIban: string
  ) => {
    if (type === "CRYPTO" && !cryptoSymbol.trim()) {
      toast.error("Choisis une crypto.")
      return false
    }

    if (type === "CRYPTO" && useCryptoNetwork && !cryptoNetwork.trim()) {
      toast.error("Sélectionne un réseau ou désactive l'option réseau.")
      return false
    }

    if (type === "BANCAIRE" && !bankIban.trim()) {
      toast.error("IBAN requis pour un moyen bancaire.")
      return false
    }

    const normalizedIban = normalizeIban(bankIban)
    if (normalizedIban && !isIbanFormatValid(normalizedIban)) {
      toast.error("Le format de l'IBAN semble invalide.")
      return false
    }

    return true
  }

  const addMoyenPaiement = async () => {
    if (!newNom.trim()) {
      toast.error("Le nom est requis.")
      return
    }

    if (
      !validatePayload(
        newType,
        newCryptoSymbol,
        newUseCryptoNetwork,
        newCryptoNetwork,
        newBankIban
      )
    ) {
      return
    }

    try {
      const res = await fetch("/api/moyens-paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: newNom,
          type: newType,
          cryptoSymbol: newType === "CRYPTO" ? newCryptoSymbol : null,
          cryptoNetwork:
            newType === "CRYPTO" && newUseCryptoNetwork ? newCryptoNetwork : null,
          bankAccountHolder: newType === "BANCAIRE" ? newBankAccountHolder : null,
          bankIban: newType === "BANCAIRE" ? normalizeIban(newBankIban) : null,
        }),
      })

      if (!res.ok) throw new Error()

      resetNewForm()
      setAddDialogOpen(false)
      await fetchMoyensPaiement()
      toast.success("Moyen de paiement ajouté.")
    } catch {
      toast.error("Erreur lors de l'ajout.")
    }
  }

  const updateMoyenPaiement = async () => {
    if (!editMoyen) return
    if (!editMoyen.nom.trim()) {
      toast.error("Le nom est requis.")
      return
    }

    if (
      !validatePayload(
        editMoyen.type,
        editMoyen.cryptoSymbol ?? "",
        editUseCryptoNetwork,
        editMoyen.cryptoNetwork ?? "",
        editMoyen.bankIban ?? ""
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/moyens-paiement/${editMoyen.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: editMoyen.nom,
          type: editMoyen.type,
          cryptoSymbol: editMoyen.type === "CRYPTO" ? editMoyen.cryptoSymbol : null,
          cryptoNetwork:
            editMoyen.type === "CRYPTO" && editUseCryptoNetwork
              ? editMoyen.cryptoNetwork
              : null,
          bankAccountHolder:
            editMoyen.type === "BANCAIRE" ? editMoyen.bankAccountHolder : null,
          bankIban:
            editMoyen.type === "BANCAIRE"
              ? normalizeIban(editMoyen.bankIban ?? "")
              : null,
        }),
      })

      if (!res.ok) throw new Error()

      setEditMoyen(null)
      setEditUseCryptoNetwork(false)
      setEditCryptoSearch("")
      await fetchMoyensPaiement()
      toast.success("Moyen de paiement modifié.")
    } catch {
      toast.error("Erreur lors de la modification.")
    }
  }

  const deleteMoyenPaiement = async (id: number) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce moyen de paiement ?"
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/moyens-paiement/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      await fetchMoyensPaiement()
      toast.success("Moyen de paiement supprimé.")
    } catch {
      toast.error("Erreur lors de la suppression.")
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Moyens de paiement"
          subtitle="Ajoutez vos moyens de paiement (crypto ou bancaire) pour les lier ensuite à vos projets."
          breadcrumb={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Moyens de paiement" },
          ]}
        />

        <div className="flex justify-end">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Ajouter un moyen de paiement</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Nouveau moyen de paiement</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="new-nom">Nom</Label>
                  <Input
                    id="new-nom"
                    placeholder="Ex: Wallet principal / Compte pro BNP"
                    value={newNom}
                    onChange={(e) => setNewNom(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={newType}
                    onValueChange={(value) => {
                      const nextType = value as TypeMoyenPaiement
                      setNewType(nextType)
                      if (nextType === "BANCAIRE") {
                        setNewUseCryptoNetwork(false)
                        setNewCryptoNetwork("")
                        setNewNetworkSearch("")
                        setNewCoinNetworks([])
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRYPTO">Crypto</SelectItem>
                      <SelectItem value="BANCAIRE">Bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newType === "CRYPTO" ? (
                  <div className="space-y-3">
                    <div className="rounded-md border p-3 space-y-3">
                      <p className="text-sm font-medium">Étape 1: Choisir la crypto</p>
                      <Input
                        placeholder="Rechercher (ex: BTC, Bitcoin, ETH...)"
                        value={newCryptoSearch}
                        onChange={(e) => setNewCryptoSearch(e.target.value)}
                      />

                      <div className="max-h-56 overflow-auto rounded-md border">
                        {filteredNewCryptoAssets.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">
                            Aucune crypto trouvée.
                          </p>
                        ) : (
                          filteredNewCryptoAssets.map((asset) => {
                            const isActive = newCryptoSymbol === asset.symbol
                            return (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  setNewCryptoSymbol(asset.symbol)
                                  setNewCryptoNetwork("")
                                  setNewNetworkSearch("")
                                }}
                                className={[
                                  "w-full px-3 py-2 border-b last:border-b-0 text-left flex items-center gap-3",
                                  isActive ? "bg-accent" : "hover:bg-muted/60",
                                ].join(" ")}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={asset.image || ""} alt={asset.name} />
                                  <AvatarFallback>{asset.symbol[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {asset.symbol}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {asset.name}
                                  </p>
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>

                      {selectedNewAsset && (
                        <div className="rounded-md border p-2 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={selectedNewAsset.image || ""}
                              alt={selectedNewAsset.name}
                            />
                            <AvatarFallback>{selectedNewAsset.symbol[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            Sélectionnée:{" "}
                            <strong>
                              {selectedNewAsset.symbol} - {selectedNewAsset.name}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="rounded-md border p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">Étape 2 (optionnel): Réseau</p>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="new-use-network" className="text-xs">
                            Spécifier un réseau
                          </Label>
                          <Switch
                            id="new-use-network"
                            checked={newUseCryptoNetwork}
                            onCheckedChange={(checked) => {
                              const isChecked = checked === true
                              setNewUseCryptoNetwork(isChecked)
                              if (!isChecked) {
                                setNewCryptoNetwork("")
                                setNewNetworkSearch("")
                              }
                            }}
                          />
                        </div>
                      </div>

                      {newUseCryptoNetwork && (
                        <div className="space-y-2">
                          <Label>
                            Réseau
                            {selectedNewAsset ? ` pour ${selectedNewAsset.symbol}` : ""}
                          </Label>
                          <Input
                            placeholder="Rechercher un réseau (ex: Ethereum, Solana, Tron...)"
                            value={newNetworkSearch}
                            onChange={(e) => setNewNetworkSearch(e.target.value)}
                          />

                          <div className="max-h-48 overflow-auto rounded-md border">
                            {filteredNewNetworks.length === 0 ? (
                              <p className="p-3 text-sm text-muted-foreground">
                                Aucun réseau trouvé.
                              </p>
                            ) : (
                              filteredNewNetworks.map((network) => {
                                const isActive = newCryptoNetwork === network
                                return (
                                  <button
                                    key={network}
                                    type="button"
                                    onClick={() => setNewCryptoNetwork(network)}
                                    className={[
                                      "w-full px-3 py-2 border-b last:border-b-0 text-left text-sm",
                                      isActive ? "bg-accent font-medium" : "hover:bg-muted/60",
                                    ].join(" ")}
                                  >
                                    {network}
                                  </button>
                                )
                              })
                            )}
                          </div>

                          {newNetworkSearch.trim().length > 0 &&
                            !newNetworkOptions.some(
                              (network) =>
                                network.toLowerCase() === newNetworkSearch.trim().toLowerCase()
                            ) && (
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setNewCryptoNetwork(newNetworkSearch.trim())}
                              >
                                {`Utiliser "${newNetworkSearch.trim()}"`}
                              </Button>
                            )}

                          {newCryptoNetwork && (
                            <p className="text-xs text-muted-foreground">
                              Réseau sélectionné: <strong>{newCryptoNetwork}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="new-bank-holder">Titulaire du compte (optionnel)</Label>
                      <Input
                        id="new-bank-holder"
                        placeholder="Ex: Aarchive SAS"
                        value={newBankAccountHolder}
                        onChange={(e) => setNewBankAccountHolder(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-bank-iban">IBAN</Label>
                      <Input
                        id="new-bank-iban"
                        placeholder="Ex: FR7612345987650123456789014"
                        value={newBankIban}
                        onChange={(e) => setNewBankIban(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={addMoyenPaiement} className="w-full">
                  Ajouter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des moyens de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            {moyensPaiement.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun moyen de paiement enregistré.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {moyensPaiement.map((moyen) => {
                  const asset =
                    cryptoAssets.find((crypto) => crypto.symbol === moyen.cryptoSymbol) ?? null
                  return (
                    <div key={moyen.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{moyen.nom}</p>
                        </div>
                        <Badge variant={moyen.type === "CRYPTO" ? "default" : "secondary"}>
                          {moyen.type === "CRYPTO" ? "Crypto" : "Bancaire"}
                        </Badge>
                      </div>

                      {moyen.type === "CRYPTO" ? (
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={asset?.image || ""} alt={asset?.name || ""} />
                              <AvatarFallback>{(moyen.cryptoSymbol || "?")[0]}</AvatarFallback>
                            </Avatar>
                            <p>Crypto: {moyen.cryptoSymbol || "Non renseignée"}</p>
                          </div>
                          {moyen.cryptoNetwork && <p>Réseau: {moyen.cryptoNetwork}</p>}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Titulaire: {moyen.bankAccountHolder || "Non renseigné"}</p>
                          <p>IBAN: {moyen.bankIban || "Non renseigné"}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditMoyen(moyen)
                            setEditUseCryptoNetwork(Boolean(moyen.cryptoNetwork))
                            setEditCryptoSearch("")
                            setEditNetworkSearch("")
                            setEditCoinNetworks([])
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => deleteMoyenPaiement(moyen.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={!!editMoyen}
          onOpenChange={(open) => {
            if (!open) {
              setEditMoyen(null)
              setEditUseCryptoNetwork(false)
              setEditCryptoSearch("")
              setEditNetworkSearch("")
            }
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Modifier un moyen de paiement</DialogTitle>
            </DialogHeader>

            {editMoyen && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-nom">Nom</Label>
                  <Input
                    id="edit-nom"
                    value={editMoyen.nom}
                    onChange={(e) =>
                      setEditMoyen({
                        ...editMoyen,
                        nom: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={editMoyen.type}
                    onValueChange={(value) => {
                      const nextType = value as TypeMoyenPaiement
                      setEditMoyen({
                        ...editMoyen,
                        type: nextType,
                      })
                      if (nextType === "BANCAIRE") {
                        setEditUseCryptoNetwork(false)
                        setEditNetworkSearch("")
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRYPTO">Crypto</SelectItem>
                      <SelectItem value="BANCAIRE">Bancaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editMoyen.type === "CRYPTO" ? (
                  <div className="space-y-3">
                    <div className="rounded-md border p-3 space-y-3">
                      <p className="text-sm font-medium">Étape 1: Choisir la crypto</p>
                      <Input
                        placeholder="Rechercher (ex: BTC, Bitcoin, ETH...)"
                        value={editCryptoSearch}
                        onChange={(e) => setEditCryptoSearch(e.target.value)}
                      />

                      <div className="max-h-56 overflow-auto rounded-md border">
                        {filteredEditCryptoAssets.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">
                            Aucune crypto trouvée.
                          </p>
                        ) : (
                          filteredEditCryptoAssets.map((asset) => {
                            const isActive = editMoyen.cryptoSymbol === asset.symbol
                            return (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() =>
                                  setEditMoyen({
                                    ...editMoyen,
                                    cryptoSymbol: asset.symbol,
                                    cryptoNetwork: null,
                                  })
                                }
                                className={[
                                  "w-full px-3 py-2 border-b last:border-b-0 text-left flex items-center gap-3",
                                  isActive ? "bg-accent" : "hover:bg-muted/60",
                                ].join(" ")}
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={asset.image || ""} alt={asset.name} />
                                  <AvatarFallback>{asset.symbol[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {asset.symbol}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {asset.name}
                                  </p>
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>

                      {selectedEditAsset && (
                        <div className="rounded-md border p-2 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={selectedEditAsset.image || ""}
                              alt={selectedEditAsset.name}
                            />
                            <AvatarFallback>{selectedEditAsset.symbol[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            Sélectionnée:{" "}
                            <strong>
                              {selectedEditAsset.symbol} - {selectedEditAsset.name}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="rounded-md border p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">Étape 2 (optionnel): Réseau</p>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="edit-use-network" className="text-xs">
                            Spécifier un réseau
                          </Label>
                          <Switch
                            id="edit-use-network"
                            checked={editUseCryptoNetwork}
                            onCheckedChange={(checked) => {
                              const isChecked = checked === true
                              setEditUseCryptoNetwork(isChecked)
                              if (!isChecked) {
                                setEditMoyen({
                                  ...editMoyen,
                                  cryptoNetwork: null,
                                })
                                setEditNetworkSearch("")
                              }
                            }}
                          />
                        </div>
                      </div>

                      {editUseCryptoNetwork && (
                        <div className="space-y-2">
                          <Label>
                            Réseau
                            {selectedEditAsset ? ` pour ${selectedEditAsset.symbol}` : ""}
                          </Label>
                          <Input
                            placeholder="Rechercher un réseau (ex: Ethereum, Solana, Tron...)"
                            value={editNetworkSearch}
                            onChange={(e) => setEditNetworkSearch(e.target.value)}
                          />

                          <div className="max-h-48 overflow-auto rounded-md border">
                            {filteredEditNetworks.length === 0 ? (
                              <p className="p-3 text-sm text-muted-foreground">
                                Aucun réseau trouvé.
                              </p>
                            ) : (
                              filteredEditNetworks.map((network) => {
                                const isActive = editMoyen.cryptoNetwork === network
                                return (
                                  <button
                                    key={network}
                                    type="button"
                                    onClick={() =>
                                      setEditMoyen({
                                        ...editMoyen,
                                        cryptoNetwork: network,
                                      })
                                    }
                                    className={[
                                      "w-full px-3 py-2 border-b last:border-b-0 text-left text-sm",
                                      isActive ? "bg-accent font-medium" : "hover:bg-muted/60",
                                    ].join(" ")}
                                  >
                                    {network}
                                  </button>
                                )
                              })
                            )}
                          </div>

                          {editNetworkSearch.trim().length > 0 &&
                            !editNetworkOptions.some(
                              (network) =>
                                network.toLowerCase() === editNetworkSearch.trim().toLowerCase()
                            ) && (
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() =>
                                  setEditMoyen({
                                    ...editMoyen,
                                    cryptoNetwork: editNetworkSearch.trim(),
                                  })
                                }
                              >
                                {`Utiliser "${editNetworkSearch.trim()}"`}
                              </Button>
                            )}

                          {editMoyen.cryptoNetwork && (
                            <p className="text-xs text-muted-foreground">
                              Réseau sélectionné: <strong>{editMoyen.cryptoNetwork}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label>Titulaire du compte (optionnel)</Label>
                      <Input
                        value={editMoyen.bankAccountHolder ?? ""}
                        onChange={(e) =>
                          setEditMoyen({
                            ...editMoyen,
                            bankAccountHolder: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>IBAN</Label>
                      <Input
                        value={editMoyen.bankIban ?? ""}
                        onChange={(e) =>
                          setEditMoyen({
                            ...editMoyen,
                            bankIban: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <Button onClick={updateMoyenPaiement} className="w-full">
                  Enregistrer
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
