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
exports.InsurersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const slugify_1 = require("../common/slugify");
let InsurersService = class InsurersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.insurer.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { offers: true },
                },
            },
        });
    }
    async findBySlug(slug) {
        const insurer = await this.prisma.insurer.findUnique({
            where: { slug },
            include: {
                offers: {
                    where: { status: "ACTIVE" },
                    orderBy: { premium: "asc" },
                },
            },
        });
        if (!insurer) {
            throw new common_1.NotFoundException("Insurer not found");
        }
        return insurer;
    }
    create(dto) {
        return this.prisma.insurer.create({
            data: {
                ...dto,
                slug: dto.slug ?? (0, slugify_1.slugify)(dto.name),
            },
        });
    }
    async update(id, dto) {
        await this.ensureExists(id);
        return this.prisma.insurer.update({
            where: { id },
            data: {
                ...dto,
                slug: dto.slug ?? (dto.name ? (0, slugify_1.slugify)(dto.name) : undefined),
            },
        });
    }
    async ensureExists(id) {
        const insurer = await this.prisma.insurer.findUnique({ where: { id }, select: { id: true } });
        if (!insurer) {
            throw new common_1.NotFoundException("Insurer not found");
        }
    }
};
exports.InsurersService = InsurersService;
exports.InsurersService = InsurersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InsurersService);
//# sourceMappingURL=insurers.service.js.map