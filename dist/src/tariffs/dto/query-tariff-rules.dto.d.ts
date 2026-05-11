import { InsuranceCategory } from "@prisma/client";
export declare class QueryTariffRulesDto {
    category?: InsuranceCategory;
    type?: string;
    insurerSlug?: string;
    usage?: string;
    power?: string;
    energy?: string;
    duration?: string;
    active?: string;
}
