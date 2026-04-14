-- CreateTable
CREATE TABLE "CycleDeclaration" (
    "id" SERIAL NOT NULL,
    "annee" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "debutSaisie" TIMESTAMP(3) NOT NULL,
    "finSaisie" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CycleDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CycleDeclaration_debutSaisie_idx" ON "CycleDeclaration"("debutSaisie");

-- CreateIndex
CREATE INDEX "CycleDeclaration_finSaisie_idx" ON "CycleDeclaration"("finSaisie");

-- CreateIndex
CREATE UNIQUE INDEX "CycleDeclaration_annee_trimestre_key" ON "CycleDeclaration"("annee", "trimestre");
