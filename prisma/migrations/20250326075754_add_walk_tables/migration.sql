-- CreateTable
CREATE TABLE "WalkCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walkName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalkCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walkName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalkRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalkCompletion_userId_walkName_key" ON "WalkCompletion"("userId", "walkName");

-- CreateIndex
CREATE UNIQUE INDEX "WalkRating_userId_walkName_key" ON "WalkRating"("userId", "walkName");

-- AddForeignKey
ALTER TABLE "WalkCompletion" ADD CONSTRAINT "WalkCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkRating" ADD CONSTRAINT "WalkRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
