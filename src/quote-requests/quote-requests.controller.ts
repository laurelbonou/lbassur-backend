import { Body, Controller, Get, Post, Patch, Param, UseGuards, NotFoundException, BadRequestException } from "@nestjs/common";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
import { QuoteRequestsService } from "./quote-requests.service";
import { PrismaService } from "../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { NotificationsService } from "../notifications/notifications.service";

@Controller("quote-requests")
export class QuoteRequestsController {
  constructor(
    private readonly quoteRequestsService: QuoteRequestsService,
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @UseGuards(ApiKeyGuard)
  findAll() {
    return this.quoteRequestsService.findAll();
  }

  @Get(":id")
  @UseGuards(ApiKeyGuard)
  findOne(@Param("id") id: string) {
    return this.quoteRequestsService.findOne(id);
  }

  @Post("draft")
  createDraft(@Body() dto: CreateQuoteRequestDto) {
    return this.quoteRequestsService.createDraft(dto);
  }

  @Post()
  create(@Body() dto: CreateQuoteRequestDto) {
    return this.quoteRequestsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: any) { // using any for now, could use UpdateQuoteRequestDto
    return this.quoteRequestsService.update(id, dto);
  }

  @Post(":id/send-to-insurer")
  @UseGuards(ApiKeyGuard) // Protect admin route
  async sendToInsurer(@Param("id") id: string) {
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: { documents: true }
    });
    
    if (!quote) throw new NotFoundException("Quote not found");
    if (!quote.selectedOfferId) throw new BadRequestException("No offer selected");

    // Get insurer email - assuming offer exists
    const offer = await this.prisma.offer.findUnique({
      where: { id: quote.selectedOfferId },
      include: { insurer: true }
    });

    if (!offer || !offer.insurer) {
      throw new BadRequestException("Insurer not found for this quote");
    }

    // Email insurer
    const insurerEmail = process.env.INSURER_MOCK_EMAIL || "insurer@example.com";
    await this.notificationsService.sendQuoteToInsurer(insurerEmail, quote, quote.documents);

    // Update status
    const updated = await this.prisma.quoteRequest.update({
      where: { id },
      data: { status: "INSURER_PENDING" }
    });

    return { success: true, quote: updated };
  }

  @Post(":id/finalize-contract")
  @UseGuards(ApiKeyGuard) // Protect admin route
  async finalizeContract(
    @Param("id") id: string,
    @Body("policyNumber") policyNumber: string
  ) {
    if (!policyNumber) throw new BadRequestException("Policy number is required");

    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: { payment: true }
    });

    if (!quote) throw new NotFoundException("Quote not found");
    if (!quote.selectedOfferId) throw new BadRequestException("No offer selected");

    const offer = await this.prisma.offer.findUnique({
      where: { id: quote.selectedOfferId },
      include: { insurer: true }
    });

    // Update quote with policy number
    const updatedQuote = await this.prisma.quoteRequest.update({
      where: { id },
      data: { policyNumber }
    });

    // Generate PDF
    const contractUrl = await this.documentsService.generateFinalContract(updatedQuote, offer!.insurer);

    // Save contract URL and complete status
    const finalQuote = await this.prisma.quoteRequest.update({
      where: { id },
      data: { 
        contractUrl,
        status: "COMPLETED" 
      }
    });

    // Send final contract to client
    await this.notificationsService.sendFinalContractToClient(quote.email || "", quote.phone, contractUrl);

    return { success: true, contractUrl, quote: finalQuote };
  }

  @Get("verify/:id")
  async verifyContract(@Param("id") id: string) {
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
      throw new NotFoundException("Invalid or non-existent contract");
    }

    return {
      valid: true,
      message: "Authentic LBAssur Contract",
      contractDetails: quote
    };
  }
}
