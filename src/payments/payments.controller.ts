import { Controller, Post, Body, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { NotificationsService } from "../notifications/notifications.service";

class SimulatePaymentDto {
  quoteRequestId: string;
  method: string;
}

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post("simulate")
  async simulatePayment(@Body() dto: SimulatePaymentDto) {
    if (!dto.quoteRequestId || !dto.method) {
      throw new BadRequestException("quoteRequestId and method are required");
    }

    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id: dto.quoteRequestId },
      include: { payment: true },
    });

    if (!quote) {
      throw new NotFoundException("QuoteRequest not found");
    }

    if (quote.payment) {
      throw new BadRequestException("Payment already exists for this quote");
    }

    // Simulate payment delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Determine amount based on budget or premium
    let amount = quote.budget || 0;
    if (!amount && quote.payload && typeof quote.payload === "object" && "price" in quote.payload) {
      amount = Number(quote.payload.price) || 0;
    }

    const payment = await this.prisma.payment.create({
      data: {
        quoteRequestId: quote.id,
        amount,
        method: dto.method,
        status: "SUCCESS",
        reference: `LB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      },
    });

    const receiptUrl = await this.documentsService.generateReceipt(quote, payment);

    // Update QuoteRequest status and receiptUrl
    await this.prisma.quoteRequest.update({
      where: { id: quote.id },
      data: { 
        status: "PROCESSING",
        receiptUrl 
      },
    });

    // Notify client and admin
    // Get admin emails (for now a default or from env)
    const adminEmail = process.env.ADMIN_EMAIL || "contact@lbassur.bj";
    await this.notificationsService.notifyClientReceipt(quote.email || "", quote.phone, receiptUrl);
    await this.notificationsService.notifyAdminNewQuote(adminEmail, quote.id);

    return {
      success: true,
      payment,
      receiptUrl
    };
  }
}
