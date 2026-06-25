import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
export declare class QuoteRequestsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Prisma.PrismaPromise<({
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            quoteRequestId: string;
            amount: Prisma.Decimal;
            method: string;
            reference: string;
        } | null;
        documents: {
            id: string;
            createdAt: Date;
            type: string;
            url: string;
            quoteRequestId: string;
            filename: string;
            mimeType: string;
            size: number;
        }[];
    } & {
        phone: string;
        insuranceType: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.LeadStatus;
        category: import(".prisma/client").$Enums.InsuranceCategory | null;
        fullName: string;
        email: string | null;
        company: string | null;
        budget: Prisma.Decimal | null;
        selectedOfferId: string | null;
        message: string | null;
        payload: Prisma.JsonValue | null;
        policyNumber: string | null;
        receiptUrl: string | null;
        contractUrl: string | null;
    })[]>;
    findOne(id: string): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            quoteRequestId: string;
            amount: Prisma.Decimal;
            method: string;
            reference: string;
        } | null;
        documents: {
            id: string;
            createdAt: Date;
            type: string;
            url: string;
            quoteRequestId: string;
            filename: string;
            mimeType: string;
            size: number;
        }[];
    } & {
        phone: string;
        insuranceType: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.LeadStatus;
        category: import(".prisma/client").$Enums.InsuranceCategory | null;
        fullName: string;
        email: string | null;
        company: string | null;
        budget: Prisma.Decimal | null;
        selectedOfferId: string | null;
        message: string | null;
        payload: Prisma.JsonValue | null;
        policyNumber: string | null;
        receiptUrl: string | null;
        contractUrl: string | null;
    }>;
    create(dto: CreateQuoteRequestDto): Prisma.Prisma__QuoteRequestClient<{
        documents: {
            id: string;
            createdAt: Date;
            type: string;
            url: string;
            quoteRequestId: string;
            filename: string;
            mimeType: string;
            size: number;
        }[];
    } & {
        phone: string;
        insuranceType: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.LeadStatus;
        category: import(".prisma/client").$Enums.InsuranceCategory | null;
        fullName: string;
        email: string | null;
        company: string | null;
        budget: Prisma.Decimal | null;
        selectedOfferId: string | null;
        message: string | null;
        payload: Prisma.JsonValue | null;
        policyNumber: string | null;
        receiptUrl: string | null;
        contractUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
