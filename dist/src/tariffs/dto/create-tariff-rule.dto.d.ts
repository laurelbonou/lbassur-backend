import { InsuranceCategory } from "@prisma/client";
export declare class CreateTariffRuleDto {
    insurerId: string;
    offerId?: string;
    insuranceTypeId?: string;
    category: InsuranceCategory;
    insuranceTypeLabel: string;
    zone?: string;
    vehicleUsage?: string;
    vehiclePower?: string;
    vehicleEnergy?: string;
    duration?: string;
    price: number;
    currency?: string;
    guarantees?: string[];
    active?: boolean;
    metadata?: Record<string, unknown>;
}
