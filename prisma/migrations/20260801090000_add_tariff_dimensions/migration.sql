CREATE TYPE "PricingStatus" AS ENUM ('STATUS_1_HIGH_RISK', 'STATUS_2_STANDARD_RISK');

ALTER TABLE "TariffRule"
ADD COLUMN "pricingStatus" "PricingStatus",
ADD COLUMN "bonusRate" DECIMAL(5,2),
ADD COLUMN "guaranteePackage" TEXT;

DROP INDEX IF EXISTS "TariffRule_vehicleUsage_vehiclePower_vehicleEnergy_duration_idx";
CREATE INDEX "TariffRule_vehicleUsage_vehiclePower_vehicleEnergy_duration_pricingStatus_idx"
ON "TariffRule"("vehicleUsage", "vehiclePower", "vehicleEnergy", "duration", "pricingStatus");

CREATE TABLE "TravelTariffRule" (
  "id" TEXT NOT NULL,
  "insurerId" TEXT NOT NULL,
  "insuranceTypeId" TEXT,
  "destinationZone" TEXT NOT NULL,
  "durationMinDays" INTEGER NOT NULL,
  "durationMaxDays" INTEGER NOT NULL,
  "travelerAgeMin" INTEGER,
  "travelerAgeMax" INTEGER,
  "guaranteePackage" TEXT,
  "price" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'XOF',
  "guarantees" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelTariffRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TravelTariffRule_destinationZone_durationMinDays_durationMaxDays_idx"
ON "TravelTariffRule"("destinationZone", "durationMinDays", "durationMaxDays");
CREATE INDEX "TravelTariffRule_travelerAgeMin_travelerAgeMax_guaranteePackage_idx"
ON "TravelTariffRule"("travelerAgeMin", "travelerAgeMax", "guaranteePackage");
CREATE INDEX "TravelTariffRule_active_idx" ON "TravelTariffRule"("active");

ALTER TABLE "TravelTariffRule"
ADD CONSTRAINT "TravelTariffRule_insurerId_fkey"
FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelTariffRule"
ADD CONSTRAINT "TravelTariffRule_insuranceTypeId_fkey"
FOREIGN KEY ("insuranceTypeId") REFERENCES "InsuranceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
