-- AlterTable
ALTER TABLE "PaiementProjet" ADD COLUMN     "anneeReference" INTEGER,
ADD COLUMN     "moisReference" INTEGER,
ADD COLUMN     "moyenPaiementId" INTEGER;

-- CreateIndex
CREATE INDEX "PaiementProjet_moyenPaiementId_idx" ON "PaiementProjet"("moyenPaiementId");

-- CreateIndex
CREATE INDEX "PaiementProjet_anneeReference_moisReference_idx" ON "PaiementProjet"("anneeReference", "moisReference");

-- AddForeignKey
ALTER TABLE "PaiementProjet" ADD CONSTRAINT "PaiementProjet_moyenPaiementId_fkey" FOREIGN KEY ("moyenPaiementId") REFERENCES "MoyenPaiement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
