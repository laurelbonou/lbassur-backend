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
exports.TariffsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TariffsService = class TariffsService {
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
        if (query.usage)
            and.push({ vehicleUsage: query.usage });
        if (query.power)
            and.push({ vehiclePower: query.power });
        if (query.energy)
            and.push({ vehicleEnergy: query.energy });
        if (query.duration)
            and.push({ duration: query.duration });
        if (query.active === "true")
            and.push({ active: true });
        if (query.active === "false")
            and.push({ active: false });
        return this.prisma.tariffRule.findMany({
            where: { AND: and },
            include: {
                insurer: true,
                offer: true,
                insuranceType: true,
            },
            orderBy: { price: "asc" },
        });
    }
    create(dto) {
        const data = {
            ...dto,
            zone: dto.zone ?? "Zone Rouge",
            currency: dto.currency ?? "XOF",
            guarantees: dto.guarantees ?? [],
            active: dto.active ?? true,
            metadata: dto.metadata,
        };
        return this.prisma.tariffRule.create({ data });
    }
    async update(id, dto) {
        await this.ensureExists(id);
        const data = {
            ...dto,
            metadata: dto.metadata,
        };
        return this.prisma.tariffRule.update({
            where: { id },
            data,
        });
    }
    async ensureExists(id) {
        const rule = await this.prisma.tariffRule.findUnique({ where: { id }, select: { id: true } });
        if (!rule) {
            throw new common_1.NotFoundException("Tariff rule not found");
        }
    }
};
exports.TariffsService = TariffsService;
exports.TariffsService = TariffsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TariffsService);
//# sourceMappingURL=tariffs.service.js.map