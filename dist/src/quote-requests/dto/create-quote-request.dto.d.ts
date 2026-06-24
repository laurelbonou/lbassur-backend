import { InsuranceCategory } from "@prisma/client";
export declare class CreateQuoteRequestDto {
    fullName: string;
    email?: string;
    phone: string;
    company?: string;
    category?: InsuranceCategory;
    insuranceType?: string;
    budget?: number;
    selectedOfferId?: string;
    message?: string;
    payload?: Record<string, unknown>;
    documents?: {
        type: string;
        filename: string;
        url: string;
        mimeType: string;
        size: number;
    }[];
}
