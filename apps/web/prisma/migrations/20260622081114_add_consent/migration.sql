-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "optOutAt" TIMESTAMP(3);
