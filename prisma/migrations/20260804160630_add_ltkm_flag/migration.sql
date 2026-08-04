-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastReviewedAt" DATETIME,
    "isLtkm" BOOLEAN NOT NULL DEFAULT false,
    "ltkmNotes" TEXT
);
INSERT INTO "new_Customer" ("createdAt", "id", "lastReviewedAt", "status", "type", "updatedAt") SELECT "createdAt", "id", "lastReviewedAt", "status", "type", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
