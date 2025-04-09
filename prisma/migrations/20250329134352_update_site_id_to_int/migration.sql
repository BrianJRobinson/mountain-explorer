/*
  Warnings:

  - Changed the type of `siteId` on the `SiteCompletion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `siteId` on the `SiteRating` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SiteCompletion" DROP COLUMN "siteId",
ADD COLUMN     "siteId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SiteRating" DROP COLUMN "siteId",
ADD COLUMN     "siteId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SiteCompletion_userId_siteId_key" ON "SiteCompletion"("userId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteRating_userId_siteId_key" ON "SiteRating"("userId", "siteId");
