const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("MOT DE PASSE ICI", 10);

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
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

// node .\prisma\seed.ts