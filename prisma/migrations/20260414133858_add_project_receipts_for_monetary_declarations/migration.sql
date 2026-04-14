-- CreateTable
CREATE TABLE "PaiementProjet" (
    "id" SERIAL NOT NULL,
    "projetId" INTEGER NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL,
    "montantRecu" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaiementProjet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaiementProjet_projetId_idx" ON "PaiementProjet"("projetId");

-- CreateIndex
CREATE INDEX "PaiementProjet_datePaiement_idx" ON "PaiementProjet"("datePaiement");

-- AddForeignKey
ALTER TABLE "PaiementProjet" ADD CONSTRAINT "PaiementProjet_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
