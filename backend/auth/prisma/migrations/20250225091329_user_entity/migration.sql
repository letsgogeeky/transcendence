/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `BlacklistToken` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlacklistToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL
);
INSERT INTO "new_BlacklistToken" ("id", "token") SELECT "id", "token" FROM "BlacklistToken";
DROP TABLE "BlacklistToken";
ALTER TABLE "new_BlacklistToken" RENAME TO "BlacklistToken";
CREATE UNIQUE INDEX "BlacklistToken_token_key" ON "BlacklistToken"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
