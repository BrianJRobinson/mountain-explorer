-- CreateTable
CREATE TABLE "MountainRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mountainId" INTEGER NOT NULL,
    "rating" DECIMAL(3,1) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MountainRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MountainRating_userId_mountainId_key" ON "MountainRating"("userId", "mountainId");

-- AddForeignKey
ALTER TABLE "MountainRating" ADD CONSTRAINT "MountainRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
