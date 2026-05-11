import { InsuranceCategory, OfferStatus } from "@prisma/client";
export declare class QueryOffersDto {
    category?: InsuranceCategory;
    type?: string;
    insurerSlug?: string;
    maxPremium?: string;
    q?: string;
    status?: OfferStatus;
    sortBy?: "premium" | "rating" | "coverage";
}
