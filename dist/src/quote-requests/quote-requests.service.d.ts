import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
export declare class QuoteRequestsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Prisma.PrismaPromise<{
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
    }[]>;
    create(dto: CreateQuoteRequestDto): Prisma.Prisma__QuoteRequestClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
