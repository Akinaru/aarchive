// scripts/dev-remote.mjs
// Ouvre un tunnel SSH vers la base PostgreSQL Coolify puis lance `next dev` dessus.
// Usage : npm run dev:remote
import { spawn } from "node:child_process"
import net from "node:net"
import dotenv from "dotenv"

dotenv.config({ quiet: true })

const {
  DATABASE_URL_REMOTE,
  REMOTE_SSH,
  REMOTE_DB_HOST,
  REMOTE_DB_PORT = "5432",
  REMOTE_LOCAL_PORT = "5433",
} = process.env

const missing = Object.entries({ DATABASE_URL_REMOTE, REMOTE_SSH, REMOTE_DB_HOST })
  .filter(([, value]) => !value)
  .map(([key]) => key)
if (missing.length > 0) {
  console.error(`❌ Variables manquantes dans .env : ${missing.join(", ")}`)
  process.exit(1)
}

const localPort = Number(REMOTE_LOCAL_PORT)

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1")
    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })
    socket.once("error", () => resolve(false))
  })
}

let tunnel = null

function stopTunnel() {
  if (tunnel && tunnel.exitCode === null) tunnel.kill()
}

if (await isPortOpen(localPort)) {
  console.log(`🔁 Port ${localPort} déjà ouvert : réutilisation du tunnel existant.`)
} else {
  console.log(`🔐 Tunnel SSH ${REMOTE_SSH} → ${REMOTE_DB_HOST}:${REMOTE_DB_PORT} (local ${localPort})`)
  // stdin ignoré : ssh demande le mot de passe via /dev/tty, et `next dev` garde le terminal.
  tunnel = spawn(
    "ssh",
    [
      "-N",
      "-o", "ExitOnForwardFailure=yes",
      "-o", "ServerAliveInterval=30",
      "-L", `127.0.0.1:${localPort}:${REMOTE_DB_HOST}:${REMOTE_DB_PORT}`,
      REMOTE_SSH,
    ],
    { stdio: ["ignore", "inherit", "inherit"] }
  )

  const tunnelExited = new Promise((resolve) => tunnel.once("exit", resolve))
  let ready = false
  // Laisse le temps de saisir le mot de passe SSH (2 min max).
  for (let i = 0; i < 240 && tunnel.exitCode === null; i++) {
    if (await isPortOpen(localPort)) {
      ready = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  if (!ready) {
    stopTunnel()
    await tunnelExited
    console.error("❌ Tunnel SSH impossible. Vérifie l'accès SSH et REMOTE_DB_HOST (l'IP Docker peut changer).")
    process.exit(1)
  }

  tunnel.once("exit", (code) => {
    console.error(`⚠️  Tunnel SSH fermé (code ${code}). La base distante n'est plus accessible.`)
  })
}

console.log("⚠️  Base de PRODUCTION : toute modification est réelle. Aucune migration depuis ce mode.\n")

const app = spawn("npx", ["next", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: DATABASE_URL_REMOTE },
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => app.kill(signal))
}

app.on("exit", (code) => {
  stopTunnel()
  process.exit(code ?? 0)
})
