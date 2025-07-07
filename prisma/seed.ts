const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config(); // pour charger le .env

const prisma = new PrismaClient();

async function main() {
  const password = process.env.USER_PASS;

  if (!password) {
    throw new Error("USER_PASS manquant dans le fichier .env");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.utilisateur.create({
    data: {
      email: "maxime@gallotta.fr",
      motDePasse: hashedPassword,
      nom: "Maxime",
    },
  });

  console.log("Utilisateur créé :", user);
}

main()
  .catch((e) => {
    console.error("Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// node .\prisma\seed.ts
// npx ts-node prisma/seed.ts