-- 3.1 Password reuse history for password change flow
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "password_history_userId_idx" ON "password_history" ("userId");
CREATE INDEX "password_history_companyId_idx" ON "password_history" ("companyId");

ALTER TABLE "password_history"
    ADD CONSTRAINT "password_history_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
