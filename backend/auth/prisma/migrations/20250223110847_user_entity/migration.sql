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
    "refreshToken" TEXT,
    "registrationDate" DATETIME,
    "lastLogin" DATETIME,
    "avatarUrl" TEXT,
    "emailValidated" INTEGER DEFAULT 0,
    "otpMethod" TEXT,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpBase32" TEXT,
    "otpAuthUrl" TEXT
);
INSERT INTO "new_users" ("avatarUrl", "email", "emailValidated", "emailVerificationToken", "id", "lastLogin", "name", "otpAuthUrl", "otpBase32", "otpMethod", "otpVerified", "password", "phoneNumber", "refreshToken", "registrationDate") SELECT "avatarUrl", "email", "emailValidated", "emailVerificationToken", "id", "lastLogin", "name", "otpAuthUrl", "otpBase32", "otpMethod", "otpVerified", "password", "phoneNumber", "refreshToken", "registrationDate" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_users_2" ON "users"("email");
Pragma writable_schema=0;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
