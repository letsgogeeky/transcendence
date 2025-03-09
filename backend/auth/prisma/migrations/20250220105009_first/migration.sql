-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerificationToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "registrationDate" DATETIME,
    "lastLogin" DATETIME,
    "avatarUrl" TEXT,
    "emailValidated" INTEGER DEFAULT 0,
    "otpMethod" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpBase32" TEXT,
    "otpAuthUrl" TEXT
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_users_2" ON "users"("email");
Pragma writable_schema=0;
