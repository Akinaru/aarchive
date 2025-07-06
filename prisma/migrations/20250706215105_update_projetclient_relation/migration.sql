/*
  Warnings:

  - The primary key for the `ProjetClient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ProjetClient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProjetClient" DROP CONSTRAINT "ProjetClient_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "ProjetClient_pkey" PRIMARY KEY ("projetId", "clientId");
