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
exports.SimulationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SimulationsService = class SimulationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async simulate(category, typeLabel, criteria) {
        const zone = criteria.zone ?? "Zone Rouge";
        const where = {
            active: true,
            category: category,
            insuranceTypeLabel: typeLabel,
            zone,
        };
        if (typeLabel === "Assurance Automobile" || typeLabel === "Assurance Moto") {
            if (criteria.usage)
                where.vehicleUsage = criteria.usage;
            if (criteria.power)
                where.vehiclePower = criteria.power;
            if (criteria.duration)
                where.duration = criteria.duration;
            if (criteria.energy) {
                where.OR = [{ vehicleEnergy: criteria.energy }, { vehicleEnergy: null }];
            }
        }
        const rules = await this.prisma.tariffRule.findMany({
            where,
            include: {
                insurer: true,
                offer: {
                    include: {
                        guaranteeLinks: {
                            include: {
                                guarantee: true
                            }
                        }
                    }
                },
            },
            orderBy: {
                price: "asc",
            },
        });
        return {
            input: { ...criteria, category, typeLabel, zone },
            count: rules.length,
            results: rules.map((rule) => ({
                id: rule.id,
                insurer: rule.insurer.name,
                insurerSlug: rule.insurer.slug,
                logoUrl: rule.insurer.logoUrl,
                offerId: rule.offerId,
                price: rule.price,
                currency: rule.currency,
                guarantees: rule.guarantees.length > 0 ? rule.guarantees : rule.offer?.guarantees ?? [],
                tag: rule.offer?.tag,
                rating: rule.offer?.rating,
                details: rule.offer ? {
                    coverageAmount: rule.offer.coverageAmount,
                    franchise: rule.offer.franchise,
                    waitingPeriod: rule.offer.waitingPeriod,
                    duration: rule.offer.duration,
                    guarantees: rule.offer.guaranteeLinks.map(g => ({
                        name: g.guarantee.name,
                        included: g.included,
                        details: g.details
                    }))
                } : null
            })),
        };
    }
    async simulateAuto(dto) {
        return this.simulate("IARDT", "Assurance Automobile", dto);
    }
};
exports.SimulationsService = SimulationsService;
exports.SimulationsService = SimulationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SimulationsService);
//# sourceMappingURL=simulations.service.js.map