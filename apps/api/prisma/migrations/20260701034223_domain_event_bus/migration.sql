-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'DISPATCHED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ProcessedEventStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "parentEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "eventId" TEXT NOT NULL,
    "handlerName" TEXT NOT NULL,
    "status" "ProcessedEventStatus" NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("eventId","handlerName")
);

-- CreateIndex
CREATE INDEX "domain_events_correlationId_idx" ON "domain_events"("correlationId");

-- CreateIndex
CREATE INDEX "domain_events_status_idx" ON "domain_events"("status");
