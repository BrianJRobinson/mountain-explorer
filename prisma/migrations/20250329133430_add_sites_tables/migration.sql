-- CreateTable
CREATE TABLE "SiteCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteCompletion_userId_siteId_key" ON "SiteCompletion"("userId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteRating_userId_siteId_key" ON "SiteRating"("userId", "siteId");

-- AddForeignKey
ALTER TABLE "SiteCompletion" ADD CONSTRAINT "SiteCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRating" ADD CONSTRAINT "SiteRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
