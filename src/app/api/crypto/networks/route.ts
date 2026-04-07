import { NextResponse } from "next/server"

type CoinDetailResponse = {
  platforms?: Record<string, string | null>
  detail_platforms?: Record<
    string,
    {
      decimal_place?: number | null
      contract_address?: string | null
    }
  >
}

type CoinGeckoPlatform = {
  id?: string
  name?: string
}

const COIN_FALLBACK_NETWORKS: Record<string, string[]> = {
  bitcoin: ["Bitcoin"],
  ethereum: ["Ethereum"],
  solana: ["Solana"],
  ripple: ["XRP Ledger"],
  tether: [
    "Ethereum",
    "Tron",
    "Solana",
    "BNB Smart Chain",
    "Polygon",
    "Arbitrum",
    "Optimism",
    "Avalanche",
  ],
  "usd-coin": [
    "Ethereum",
    "Solana",
    "Polygon",
    "Arbitrum",
    "Optimism",
    "Avalanche",
    "Base",
  ],
}

function prettifyPlatformId(value: string): string {
  const base = value.replace(/[_-]+/g, " ").trim()
  if (base.length === 0) return value
  return base
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
}

function normalizeSpecialNetworkName(name: string): string {
  const key = name.toLowerCase()
  if (key === "binance smart chain") return "BNB Smart Chain"
  if (key === "xdai") return "Gnosis"
  if (key === "matic network") return "Polygon"
  if (key === "tron") return "Tron"
  return name
}

async function safeJsonFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 12 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const coinId = url.searchParams.get("coinId")?.trim()

  if (!coinId) {
    return NextResponse.json({ error: "coinId requis" }, { status: 400 })
  }

  const [coinDetails, assetPlatforms] = await Promise.all([
    safeJsonFetch<CoinDetailResponse>(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
        coinId
      )}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`
    ),
    safeJsonFetch<CoinGeckoPlatform[]>(
      "https://api.coingecko.com/api/v3/asset_platforms"
    ),
  ])

  const platformIds = new Set<string>()

  if (coinDetails?.detail_platforms) {
    Object.keys(coinDetails.detail_platforms).forEach((id) => {
      const normalized = id.trim()
      if (normalized.length > 0) platformIds.add(normalized)
    })
  }

  if (coinDetails?.platforms) {
    Object.entries(coinDetails.platforms).forEach(([id, contract]) => {
      const normalized = id.trim()
      if (normalized.length === 0) return
      if (typeof contract === "string" && contract.trim().length === 0) return
      platformIds.add(normalized)
    })
  }

  const nameById = new Map<string, string>()
  ;(assetPlatforms ?? []).forEach((platform) => {
    if (typeof platform.id !== "string") return
    const id = platform.id.trim()
    if (!id) return
    const name =
      typeof platform.name === "string" && platform.name.trim().length > 0
        ? platform.name.trim()
        : prettifyPlatformId(id)
    nameById.set(id, normalizeSpecialNetworkName(name))
  })

  const networksFromCoin = Array.from(platformIds)
    .map((id) => nameById.get(id) ?? normalizeSpecialNetworkName(prettifyPlatformId(id)))
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .sort((a, b) => a.localeCompare(b, "fr"))

  const fallback = COIN_FALLBACK_NETWORKS[coinId] ?? []
  const networks =
    networksFromCoin.length > 0
      ? networksFromCoin
      : fallback

  return NextResponse.json({
    coinId,
    networks,
    source: networksFromCoin.length > 0 ? "coingecko-coin" : "fallback",
  })
}
