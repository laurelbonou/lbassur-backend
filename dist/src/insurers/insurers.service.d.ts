import { PrismaService } from "../prisma/prisma.service";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";
export declare class InsurersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            offers: number;
        };
    } & {
        name: string;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: string | null;
        categories: import(".prisma/client").$Enums.InsuranceCategory[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findBySlug(slug: string): Promise<{
        offers: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OfferStatus;
            premium: import("@prisma/client/runtime/library").Decimal;
            category: import(".prisma/client").$Enums.InsuranceCategory;
            insuranceTypeId: string | null;
            insuranceTypeLabel: string;
            insuranceSubType: string | null;
            insurerId: string;
            billingPeriod: import(".prisma/client").$Enums.BillingPeriod;
            rate: import("@prisma/client/runtime/library").Decimal | null;
            coverageAmount: import("@prisma/client/runtime/library").Decimal;
            franchise: import("@prisma/client/runtime/library").Decimal;
            guarantees: string[];
            optionalGuarantees: string[];
            exclusions: string[];
            duration: string;
            waitingPeriod: string;
            terms: string | null;
            rating: import("@prisma/client/runtime/library").Decimal;
            isMandatory: boolean;
            tag: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        name: string;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: string | null;
        categories: import(".prisma/client").$Enums.InsuranceCategory[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateInsurerDto): import(".prisma/client").Prisma.Prisma__InsurerClient<{
        name: string;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: string | null;
        categories: import(".prisma/client").$Enums.InsuranceCategory[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateInsurerDto): Promise<{
        name: string;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: string | null;
        categories: import(".prisma/client").$Enums.InsuranceCategory[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private ensureExists;
}
