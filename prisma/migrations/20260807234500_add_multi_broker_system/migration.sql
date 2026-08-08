-- CreateEnum
CREATE TYPE "IntermediaryType" AS ENUM ('COURTIER', 'AGENT_GENERAL');

-- AlterEnum
ALTER TYPE "CommissionStatus" ADD VALUE 'RATE_UNDEFINED';

-- DropIndex
DROP INDEX "Broker_code_key";

-- AlterTable
ALTER TABLE "Broker" DROP COLUMN "code",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "approvalRank" INTEGER,
ADD COLUMN     "approvalYear" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "insurerId" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "type" "IntermediaryType" NOT NULL DEFAULT 'COURTIER',
ALTER COLUMN "commissionRate" DROP NOT NULL,
ALTER COLUMN "commissionRate" DROP DEFAULT,
ALTER COLUMN "platformRate" DROP NOT NULL,
ALTER COLUMN "platformRate" DROP DEFAULT;

-- CreateTable
CREATE TABLE "BrokerInsurerCode" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "insurerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerInsurerCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrokerInsurerCode_code_idx" ON "BrokerInsurerCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerInsurerCode_insurerId_code_key" ON "BrokerInsurerCode"("insurerId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerInsurerCode_brokerId_insurerId_key" ON "BrokerInsurerCode"("brokerId", "insurerId");

-- CreateIndex
CREATE INDEX "Broker_type_idx" ON "Broker"("type");

-- CreateIndex
CREATE INDEX "Broker_insurerId_idx" ON "Broker"("insurerId");

-- CreateIndex
CREATE INDEX "Broker_active_idx" ON "Broker"("active");

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerInsurerCode" ADD CONSTRAINT "BrokerInsurerCode_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerInsurerCode" ADD CONSTRAINT "BrokerInsurerCode_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "TariffRule_vehicleUsage_vehiclePower_vehicleEnergy_duration_pri" RENAME TO "TariffRule_vehicleUsage_vehiclePower_vehicleEnergy_duration_idx";

-- RenameIndex
ALTER INDEX "TravelTariffRule_destinationZone_durationMinDays_durationMaxDay" RENAME TO "TravelTariffRule_destinationZone_durationMinDays_durationMa_idx";

-- RenameIndex
ALTER INDEX "TravelTariffRule_travelerAgeMin_travelerAgeMax_guaranteePackage" RENAME TO "TravelTariffRule_travelerAgeMin_travelerAgeMax_guaranteePac_idx";
