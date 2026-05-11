"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OffersService = class OffersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(query) {
        const and = [];
        if (query.category)
            and.push({ category: query.category });
        if (query.type && query.type !== "Tous")
            and.push({ insuranceTypeLabel: query.type });
        if (query.insurerSlug)
            and.push({ insurer: { slug: query.insurerSlug } });
        if (query.maxPremium)
            and.push({ premium: { lte: Number(query.maxPremium) } });
        if (query.q) {
            and.push({
                OR: [
                    { insurer: { name: { contains: query.q, mode: "insensitive" } } },
                    { insuranceTypeLabel: { contains: query.q, mode: "insensitive" } },
                    { insuranceSubType: { contains: query.q, mode: "insensitive" } },
                ],
            });
        }
        const orderBy = query.sortBy === "rating"
            ? { rating: "desc" }
            : query.sortBy === "coverage"
                ? { coverageAmount: "desc" }
                : { premium: "asc" };
        return this.prisma.offer.findMany({
            where: {
                status: query.status ?? "ACTIVE",
                AND: and,
            },
            include: {
                insurer: true,
                insuranceType: true,
            },
            orderBy,
        });
    }
    async findOne(id) {
        const offer = await this.prisma.offer.findUnique({
            where: { id },
            include: {
                insurer: true,
                insuranceType: true,
                guaranteeLinks: {
                    include: { guarantee: true },
                },
                tariffRules: true,
            },
        });
        if (!offer) {
            throw new common_1.NotFoundException("Offer not found");
        }
        return offer;
    }
    create(dto) {
        const data = {
            ...dto,
            billingPeriod: dto.billingPeriod ?? "ANNUAL",
            franchise: dto.franchise ?? 0,
            guarantees: dto.guarantees ?? [],
            optionalGuarantees: dto.optionalGuarantees ?? [],
            exclusions: dto.exclusions ?? [],
            duration: dto.duration ?? "12 mois",
            waitingPeriod: dto.waitingPeriod ?? "Immediat",
            rating: dto.rating ?? 0,
            isMandatory: dto.isMandatory ?? false,
            status: dto.status ?? "ACTIVE",
            metadata: dto.metadata,
        };
        return this.prisma.offer.create({
            data,
        });
    }
    async update(id, dto) {
        await this.ensureExists(id);
        const data = {
            ...dto,
            metadata: dto.metadata,
        };
        return this.prisma.offer.update({
            where: { id },
            data,
        });
    }
    async ensureExists(id) {
        const offer = await this.prisma.offer.findUnique({ where: { id }, select: { id: true } });
        if (!offer) {
            throw new common_1.NotFoundException("Offer not found");
        }
    }
};
exports.OffersService = OffersService;
exports.OffersService = OffersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OffersService);
//# sourceMappingURL=offers.service.js.map