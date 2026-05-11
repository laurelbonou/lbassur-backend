import { InsuranceCategory } from "@prisma/client";
export declare class CreateInsurerDto {
    name: string;
    slug?: string;
    logoUrl?: string;
    description?: string;
    website?: string;
    phone?: string;
    address?: string;
    categories: InsuranceCategory[];
}
