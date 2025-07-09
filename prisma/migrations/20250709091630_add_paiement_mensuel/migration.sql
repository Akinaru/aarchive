-- CreateTable
CREATE TABLE "PaiementMensuel" (
    "id" SERIAL NOT NULL,
    "mois" TIMESTAMP(3) NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaiementMensuel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaiementMensuel_mois_key" ON "PaiementMensuel"("mois");
