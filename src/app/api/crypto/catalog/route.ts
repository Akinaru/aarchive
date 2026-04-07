import { NextResponse } from "next/server"

type CryptoAsset = {
  id: string
  symbol: string
  name: string
  image: string | null
}

type CoinGeckoMarketCoin = {
  id?: string
  symbol?: string
  name?: string
  image?: string
}

type CoinGeckoPlatform = {
  name?: string
}

const FALLBACK_ASSETS: CryptoAsset[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: null },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", image: null },
  { id: "tether", symbol: "USDT", name: "Tether", image: null },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin", image: null },
  { id: "solana", symbol: "SOL", name: "Solana", image: null },
  { id: "ripple", symbol: "XRP", name: "XRP", image: null },
  { id: "bnb", symbol: "BNB", name: "BNB", image: null },
]

const FALLBACK_NETWORKS = [
  "Bitcoin",
  "Ethereum",
  "BNB Smart Chain",
  "Solana",
  "Polygon",
  "Arbitrum",
  "Optimism",
  "Base",
  "Tron",
]

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

export async function GET() {
  const [coins, platforms] = await Promise.all([
    safeJsonFetch<CoinGeckoMarketCoin[]>(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=80&page=1&sparkline=false"
    ),
    safeJsonFetch<CoinGeckoPlatform[]>(
      "https://api.coingecko.com/api/v3/asset_platforms"
    ),
  ])

  const assets: CryptoAsset[] =
    coins
      ?.map((coin) => ({
        id: typeof coin.id === "string" ? coin.id : "",
        symbol:
          typeof coin.symbol === "string" ? coin.symbol.toUpperCase() : "",
        name: typeof coin.name === "string" ? coin.name : "",
        image: typeof coin.image === "string" ? coin.image : null,
      }))
      .filter((coin) => coin.id && coin.symbol && coin.name) ?? []

  const networks =
    platforms
      ?.map((platform) =>
        typeof platform.name === "string" ? platform.name.trim() : ""
      )
      .filter((name) => name.length > 0)
      .filter((name, index, array) => array.indexOf(name) === index)
      .slice(0, 200) ?? []

  return NextResponse.json({
    assets: assets.length > 0 ? assets : FALLBACK_ASSETS,
    networks: networks.length > 0 ? networks : FALLBACK_NETWORKS,
    source: assets.length > 0 || networks.length > 0 ? "coingecko" : "fallback",
  })
}
