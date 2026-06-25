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
exports.QuoteRequestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QuoteRequestsService = class QuoteRequestsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.quoteRequest.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                documents: true,
                payment: true,
            }
        });
    }
    async findOne(id) {
        const quote = await this.prisma.quoteRequest.findUnique({
            where: { id },
            include: {
                documents: true,
                payment: true,
            }
        });
        if (!quote)
            throw new Error("Quote not found");
        return quote;
    }
    create(dto) {
        const { documents, ...rest } = dto;
        const data = {
            ...rest,
            status: "NEW",
            payload: rest.payload,
            documents: documents?.length
                ? {
                    create: documents.map((doc) => ({
                        type: doc.type,
                        filename: doc.filename,
                        url: doc.url,
                        mimeType: doc.mimeType,
                        size: doc.size,
                    })),
                }
                : undefined,
        };
        return this.prisma.quoteRequest.create({
            data,
            include: {
                documents: true,
            },
        });
    }
};
exports.QuoteRequestsService = QuoteRequestsService;
exports.QuoteRequestsService = QuoteRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuoteRequestsService);
//# sourceMappingURL=quote-requests.service.js.map