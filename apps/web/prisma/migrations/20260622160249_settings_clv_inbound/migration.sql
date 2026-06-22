-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "churnScore" DOUBLE PRECISION,
ADD COLUMN     "clvScore" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "InboundMessage" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "channel" TEXT NOT NULL,
    "fromAddress" TEXT,
    "body" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "isStop" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboundMessage_createdAt_idx" ON "InboundMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
