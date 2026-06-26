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
        const { documents, signatureData, ...rest } = dto;
        let signatureUrl = undefined;
        if (signatureData) {
            const fs = require('fs');
            const path = require('path');
            const signaturesDir = path.join(__dirname, '..', '..', '..', 'uploads', 'signatures');
            if (!fs.existsSync(signaturesDir)) {
                fs.mkdirSync(signaturesDir, { recursive: true });
            }
            const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `sign-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
            fs.writeFileSync(path.join(signaturesDir, fileName), buffer);
            signatureUrl = `/uploads/signatures/${fileName}`;
        }
        const data = {
            ...rest,
            status: "NEW",
            signatureUrl,
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
    async createDraft(dto) {
        const client = await this.prisma.client.upsert({
            where: { phone: dto.phone },
            update: {
                fullName: dto.fullName || undefined,
                email: dto.email || undefined,
            },
            create: {
                phone: dto.phone,
                fullName: dto.fullName,
                email: dto.email,
            }
        });
        const data = {
            fullName: dto.fullName,
            phone: dto.phone,
            email: dto.email,
            status: "DRAFT",
            client: { connect: { id: client.id } }
        };
        return this.prisma.quoteRequest.create({
            data,
        });
    }
    async update(id, dto) {
        const { documents, signatureData, ...rest } = dto;
        let signatureUrl = undefined;
        if (signatureData) {
            const fs = require('fs');
            const path = require('path');
            const signaturesDir = path.join(__dirname, '..', '..', '..', 'uploads', 'signatures');
            if (!fs.existsSync(signaturesDir)) {
                fs.mkdirSync(signaturesDir, { recursive: true });
            }
            const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `sign-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
            fs.writeFileSync(path.join(signaturesDir, fileName), buffer);
            signatureUrl = `/uploads/signatures/${fileName}`;
        }
        const dataToUpdate = {
            ...rest,
            signatureUrl: signatureUrl || undefined,
            payload: rest.payload ? rest.payload : undefined,
        };
        if (rest.selectedOfferId) {
            dataToUpdate.status = "NEW";
        }
        return this.prisma.quoteRequest.update({
            where: { id },
            data: {
                ...dataToUpdate,
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
            },
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