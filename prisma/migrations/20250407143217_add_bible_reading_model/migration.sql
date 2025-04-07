-- CreateTable
CREATE TABLE "BibleReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "book" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BibleReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BibleReading_userId_createdAt_idx" ON "BibleReading"("userId", "createdAt");
