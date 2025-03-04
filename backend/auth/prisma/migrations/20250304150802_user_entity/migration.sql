/*
  Warnings:

  - You are about to drop the `BlacklistToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "googleLinkedAccount" INTEGER DEFAULT 0;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BlacklistToken";
PRAGMA foreign_keys=on;
