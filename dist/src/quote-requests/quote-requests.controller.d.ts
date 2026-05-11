import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
import { QuoteRequestsService } from "./quote-requests.service";
export declare class QuoteRequestsController {
    private readonly quoteRequestsService;
    constructor(quoteRequestsService: QuoteRequestsService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
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
        budget: import("@prisma/client/runtime/library").Decimal | null;
        selectedOfferId: string | null;
        message: string | null;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    create(dto: CreateQuoteRequestDto): import(".prisma/client").Prisma.Prisma__QuoteRequestClient<{
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
        budget: import("@prisma/client/runtime/library").Decimal | null;
        selectedOfferId: string | null;
        message: string | null;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
