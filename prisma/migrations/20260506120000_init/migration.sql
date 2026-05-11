-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InsuranceCategory" AS ENUM ('IARDT', 'PERSONNES', 'VIE');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'ANNUAL', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');

-- CreateTable
CREATE TABLE "Insurer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "categories" "InsuranceCategory"[] DEFAULT ARRAY[]::"InsuranceCategory"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insurer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "InsuranceCategory" NOT NULL,
    "subType" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "category" "InsuranceCategory" NOT NULL,
    "insuranceTypeId" TEXT,
    "insuranceTypeLabel" TEXT NOT NULL,
    "insuranceSubType" TEXT,
    "insurerId" TEXT NOT NULL,
    "premium" DECIMAL(12,2) NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'ANNUAL',
    "rate" DECIMAL(6,3),
    "coverageAmount" DECIMAL(14,2) NOT NULL,
    "franchise" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "guarantees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optionalGuarantees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" TEXT NOT NULL DEFAULT '12 mois',
    "waitingPeriod" TEXT NOT NULL DEFAULT 'Immediat',
    "terms" TEXT,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "tag" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guarantee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "InsuranceCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferGuarantee" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "guaranteeId" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "details" TEXT,

    CONSTRAINT "OfferGuarantee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffRule" (
    "id" TEXT NOT NULL,
    "offerId" TEXT,
    "insurerId" TEXT NOT NULL,
    "insuranceTypeId" TEXT,
    "category" "InsuranceCategory" NOT NULL,
    "insuranceTypeLabel" TEXT NOT NULL,
    "zone" TEXT NOT NULL DEFAULT 'Zone Rouge',
    "vehicleUsage" TEXT,
    "vehiclePower" TEXT,
    "vehicleEnergy" TEXT,
    "duration" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "guarantees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "category" "InsuranceCategory",
    "insuranceType" TEXT,
    "budget" DECIMAL(12,2),
    "selectedOfferId" TEXT,
    "message" TEXT,
    "payload" JSONB,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Insurer_slug_key" ON "Insurer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceType_slug_key" ON "InsuranceType"("slug");

-- CreateIndex
CREATE INDEX "InsuranceType_category_idx" ON "InsuranceType"("category");

-- CreateIndex
CREATE INDEX "Offer_category_insuranceTypeLabel_idx" ON "Offer"("category", "insuranceTypeLabel");

-- CreateIndex
CREATE INDEX "Offer_insurerId_idx" ON "Offer"("insurerId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Guarantee_slug_key" ON "Guarantee"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OfferGuarantee_offerId_guaranteeId_key" ON "OfferGuarantee"("offerId", "guaranteeId");

-- CreateIndex
CREATE INDEX "TariffRule_category_insuranceTypeLabel_idx" ON "TariffRule"("category", "insuranceTypeLabel");

-- CreateIndex
CREATE INDEX "TariffRule_vehicleUsage_vehiclePower_vehicleEnergy_duration_idx" ON "TariffRule"("vehicleUsage", "vehiclePower", "vehicleEnergy", "duration");

-- CreateIndex
CREATE INDEX "TariffRule_active_idx" ON "TariffRule"("active");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");

-- CreateIndex
CREATE INDEX "QuoteRequest_createdAt_idx" ON "QuoteRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_insuranceTypeId_fkey" FOREIGN KEY ("insuranceTypeId") REFERENCES "InsuranceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferGuarantee" ADD CONSTRAINT "OfferGuarantee_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferGuarantee" ADD CONSTRAINT "OfferGuarantee_guaranteeId_fkey" FOREIGN KEY ("guaranteeId") REFERENCES "Guarantee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "Insurer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffRule" ADD CONSTRAINT "TariffRule_insuranceTypeId_fkey" FOREIGN KEY ("insuranceTypeId") REFERENCES "InsuranceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

