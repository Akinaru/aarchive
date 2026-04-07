-- CreateTable
CREATE TABLE "ProjetMoyenPaiement" (
    "id" SERIAL NOT NULL,
    "projetId" INTEGER NOT NULL,
    "moyenPaiementId" INTEGER NOT NULL,

    CONSTRAINT "ProjetMoyenPaiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjetMoyenPaiement_projetId_idx" ON "ProjetMoyenPaiement"("projetId");

-- CreateIndex
CREATE INDEX "ProjetMoyenPaiement_moyenPaiementId_idx" ON "ProjetMoyenPaiement"("moyenPaiementId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetMoyenPaiement_projetId_moyenPaiementId_key" ON "ProjetMoyenPaiement"("projetId", "moyenPaiementId");

-- AddForeignKey
ALTER TABLE "ProjetMoyenPaiement" ADD CONSTRAINT "ProjetMoyenPaiement_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetMoyenPaiement" ADD CONSTRAINT "ProjetMoyenPaiement_moyenPaiementId_fkey" FOREIGN KEY ("moyenPaiementId") REFERENCES "MoyenPaiement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
