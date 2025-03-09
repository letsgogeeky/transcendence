/*
  Warnings:

  - You are about to drop the column `otpAuthUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `otpVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `users` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "emailVerificationToken" TEXT NOT NULL,
    "registrationDate" DATETIME,
    "lastLogin" DATETIME,
    "avatarUrl" TEXT,
    "emailValidated" INTEGER DEFAULT 0,
    "otpMethod" TEXT,
    "otpBase32" TEXT,
    "loginLevel" TEXT NOT NULL DEFAULT 'NONE'
);
INSERT INTO "new_users" ("avatarUrl", "email", "emailValidated", "emailVerificationToken", "id", "lastLogin", "loginLevel", "name", "otpBase32", "otpMethod", "password", "phoneNumber", "registrationDate") SELECT "avatarUrl", "email", "emailValidated", "emailVerificationToken", "id", "lastLogin", "loginLevel", "name", "otpBase32", "otpMethod", "password", "phoneNumber", "registrationDate" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_users_2" ON "users"("email");
Pragma writable_schema=0;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
