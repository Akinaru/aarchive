// src/lib/versioning.ts
import pkg from "../../package.json" assert { type: "json" }

export const GITHUB_PKG_URL = "https://github.com/Akinaru/aarchive/blob/master/package.json"

const toRaw = (u: string) => {
  try {
    const url = new URL(u)
    if (url.hostname === "github.com") {
      const p = url.pathname.split("/").filter(Boolean)
      if (p[2] === "blob") return `https://raw.githubusercontent.com/${p[0]}/${p[1]}/${p[3]}/${p.slice(4).join("/")}`
    }
  } catch {}
  return u
}

const norm = (v?: string | null) => (v ?? "0.0.0").trim().replace(/^v/i, "")
const parse = (v: string) => {
  const [a, b, c] = norm(v).split("-")[0].split(".").map(n => parseInt(n || "0", 10) || 0)
  return { a, b, c }
}

export function getLocalVersion(): string {
  return norm((pkg as any)?.version)
}

export async function getRemoteVersion(): Promise<string | null> {
  try {
    const res = await fetch(toRaw(GITHUB_PKG_URL), { cache: "no-store" })
    if (!res.ok) return null
    const json = await res.json()
    return norm(json?.version)
  } catch {
    return null
  }
}

export function compareVersions(a: string, b: string): number {
  const A = norm(a).split(".").map(n => parseInt(n, 10) || 0)
  const B = norm(b).split(".").map(n => parseInt(n, 10) || 0)
  const len = Math.max(A.length, B.length)
  for (let i = 0; i < len; i++) {
    const ai = A[i] ?? 0
    const bi = B[i] ?? 0
    if (ai !== bi) return ai > bi ? 1 : -1
  }
  return 0
}