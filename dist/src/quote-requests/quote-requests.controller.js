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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteRequestsController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../common/guards/api-key.guard");
const create_quote_request_dto_1 = require("./dto/create-quote-request.dto");
const quote_requests_service_1 = require("./quote-requests.service");
const prisma_service_1 = require("../prisma/prisma.service");
const documents_service_1 = require("../documents/documents.service");
const notifications_service_1 = require("../notifications/notifications.service");
let QuoteRequestsController = class QuoteRequestsController {
    quoteRequestsService;
    prisma;
    documentsService;
    notificationsService;
    constructor(quoteRequestsService, prisma, documentsService, notificationsService) {
        this.quoteRequestsService = quoteRequestsService;
        this.prisma = prisma;
        this.documentsService = documentsService;
        this.notificationsService = notificationsService;
    }
    findAll() {
        return this.quoteRequestsService.findAll();
    }
    findOne(id) {
        return this.quoteRequestsService.findOne(id);
    }
    create(dto) {
        return this.quoteRequestsService.create(dto);
    }
    async sendToInsurer(id) {
        const quote = await this.prisma.quoteRequest.findUnique({
            where: { id },
            include: { documents: true }
        });
        if (!quote)
            throw new common_1.NotFoundException("Quote not found");
        if (!quote.selectedOfferId)
            throw new common_1.BadRequestException("No offer selected");
        const offer = await this.prisma.offer.findUnique({
            where: { id: quote.selectedOfferId },
            include: { insurer: true }
        });
        if (!offer || !offer.insurer) {
            throw new common_1.BadRequestException("Insurer not found for this quote");
        }
        const insurerEmail = process.env.INSURER_MOCK_EMAIL || "insurer@example.com";
        await this.notificationsService.sendQuoteToInsurer(insurerEmail, quote, quote.documents);
        const updated = await this.prisma.quoteRequest.update({
            where: { id },
            data: { status: "INSURER_PENDING" }
        });
        return { success: true, quote: updated };
    }
    async finalizeContract(id, policyNumber) {
        if (!policyNumber)
            throw new common_1.BadRequestException("Policy number is required");
        const quote = await this.prisma.quoteRequest.findUnique({
            where: { id },
            include: { payment: true }
        });
        if (!quote)
            throw new common_1.NotFoundException("Quote not found");
        if (!quote.selectedOfferId)
            throw new common_1.BadRequestException("No offer selected");
        const offer = await this.prisma.offer.findUnique({
            where: { id: quote.selectedOfferId },
            include: { insurer: true }
        });
        const updatedQuote = await this.prisma.quoteRequest.update({
            where: { id },
            data: { policyNumber }
        });
        const contractUrl = await this.documentsService.generateFinalContract(updatedQuote, offer.insurer);
        const finalQuote = await this.prisma.quoteRequest.update({
            where: { id },
            data: {
                contractUrl,
                status: "COMPLETED"
            }
        });
        await this.notificationsService.sendFinalContractToClient(quote.email || "", quote.phone, contractUrl);
        return { success: true, contractUrl, quote: finalQuote };
    }
    async verifyContract(id) {
        const quote = await this.prisma.quoteRequest.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                status: true,
                policyNumber: true,
                contractUrl: true,
                createdAt: true,
            }
        });
        if (!quote || quote.status !== "COMPLETED") {
            throw new common_1.NotFoundException("Invalid or non-existent contract");
        }
        return {
            valid: true,
            message: "Authentic LBAssur Contract",
            contractDetails: quote
        };
    }
};
exports.QuoteRequestsController = QuoteRequestsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuoteRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuoteRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_quote_request_dto_1.CreateQuoteRequestDto]),
    __metadata("design:returntype", void 0)
], QuoteRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(":id/send-to-insurer"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuoteRequestsController.prototype, "sendToInsurer", null);
__decorate([
    (0, common_1.Post)(":id/finalize-contract"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("policyNumber")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuoteRequestsController.prototype, "finalizeContract", null);
__decorate([
    (0, common_1.Get)("verify/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuoteRequestsController.prototype, "verifyContract", null);
exports.QuoteRequestsController = QuoteRequestsController = __decorate([
    (0, common_1.Controller)("quote-requests"),
    __metadata("design:paramtypes", [quote_requests_service_1.QuoteRequestsService,
        prisma_service_1.PrismaService,
        documents_service_1.DocumentsService,
        notifications_service_1.NotificationsService])
], QuoteRequestsController);
//# sourceMappingURL=quote-requests.controller.js.map