/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_verificationToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "verificationExpires",
DROP COLUMN "verificationToken";
