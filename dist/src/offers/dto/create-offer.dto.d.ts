import { BillingPeriod, InsuranceCategory, OfferStatus } from "@prisma/client";
export declare class CreateOfferDto {
    category: InsuranceCategory;
    insuranceTypeId?: string;
    insuranceTypeLabel: string;
    insuranceSubType?: string;
    insurerId: string;
    premium: number;
    billingPeriod?: BillingPeriod;
    rate?: number;
    coverageAmount: number;
    franchise?: number;
    guarantees?: string[];
    optionalGuarantees?: string[];
    exclusions?: string[];
    duration?: string;
    waitingPeriod?: string;
    terms?: string;
    rating?: number;
    isMandatory?: boolean;
    tag?: string;
    status?: OfferStatus;
    metadata?: Record<string, unknown>;
}
