/*
  Warnings:

  - You are about to alter the column `rating` on the `MountainRating` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,1)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "MountainRating" ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION;
