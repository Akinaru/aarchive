// src/app/api/sauvegarde/route.ts
import { spawn } from "node:child_process"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { format } from "date-fns"
import { authOptions } from "@/lib/authOptions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** pg_dump refuse les paramètres propres à Prisma (?schema=..., ?connection_limit=...). */
function toLibpqUrl(databaseUrl: string) {
  const url = new URL(databaseUrl)
  const sslmode = url.searchParams.get("sslmode")
  url.search = ""
  if (sslmode) url.searchParams.set("sslmode", sslmode)
  return url.toString()
}

function runPgDump(databaseUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // --clean --if-exists : le fichier peut être rejoué directement sur une base existante.
    const child = spawn("pg_dump", [
      "--dbname",
      toLibpqUrl(databaseUrl),
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
    ])

    const out: Buffer[] = []
    const err: Buffer[] = []
    child.stdout.on("data", (chunk: Buffer) => out.push(chunk))
    child.stderr.on("data", (chunk: Buffer) => err.push(chunk))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(out))
      else reject(new Error(Buffer.concat(err).toString().trim() || `pg_dump a échoué (code ${code})`))
    })
  })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    return NextResponse.json({ error: "DATABASE_URL non configurée" }, { status: 500 })
  }

  try {
    const dump = await runPgDump(databaseUrl)
    const filename = `aarchive-${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.sql`

    return new NextResponse(new Uint8Array(dump), {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const missingBinary = (error as NodeJS.ErrnoException).code === "ENOENT"
    console.error("Erreur GET /api/sauvegarde :", error)
    return NextResponse.json(
      { error: missingBinary ? "pg_dump est introuvable sur le serveur." : "La sauvegarde a échoué." },
      { status: 500 }
    )
  }
}
