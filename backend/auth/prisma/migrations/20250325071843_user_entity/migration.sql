-- CreateTable
CREATE TABLE "Friends" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Friends_sender_fkey" FOREIGN KEY ("sender") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friends_receiver_fkey" FOREIGN KEY ("receiver") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
