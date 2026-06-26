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

  @Post("initialize")
  async initializePayment(@Body() dto: SimulatePaymentDto) {
    if (!dto.quoteRequestId) {
      throw new BadRequestException("quoteRequestId is required");
    }

    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id: dto.quoteRequestId },
      include: { payment: true },
    });

    if (!quote) throw new NotFoundException("QuoteRequest not found");
    if (quote.payment && quote.payment.status === "SUCCESS") {
      throw new BadRequestException("Payment already completed for this quote");
    }

    let amount = quote.budget || 0;
    if (!amount && quote.payload && typeof quote.payload === "object" && "price" in quote.payload) {
      amount = Number(quote.payload.price) || 0;
    }

    const reference = `LB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Create or update pending payment
    const payment = await this.prisma.payment.upsert({
      where: { quoteRequestId: quote.id },
      create: {
        quoteRequestId: quote.id,
        amount,
        method: dto.method || "FEEXPAY",
        status: "PENDING",
        reference,
      },
      update: {
        amount,
        reference,
        status: "PENDING",
      }
    });

    // FeexPay URL generation
    const shopId = process.env.FEEXPAY_SHOP_ID || "MOCK_SHOP_ID";
    // We mock the FeexPay URL for Sandbox. In prod, you may need a server-to-server request.
    const feexPayUrl = `https://api.feexpay.me/pay?shop_id=${shopId}&amount=${amount}&reference=${reference}&callback_info=${quote.id}`;

    return {
      success: true,
      paymentUrl: feexPayUrl,
      reference,
    };
  }

  @Post("webhook")
  async feexpayWebhook(@Body() body: any) {
    // Expected FeexPay Webhook payload:
    // { reference: string, status: "SUCCESS" | "FAILED", amount: number, ... }
    const { reference, status } = body;

    if (!reference) throw new BadRequestException("Missing reference");

    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { quoteRequest: true },
    });

    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status === "SUCCESS") return { received: true }; // Already processed

    if (status === "SUCCESS" || status === "SUCCESSFUL" || status === "COMPLETED") {
      // Finalize payment
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS" }
      });

      const quote = payment.quoteRequest;
      const receiptUrl = await this.documentsService.generateReceipt(quote, payment);

      await this.prisma.quoteRequest.update({
        where: { id: quote.id },
        data: { 
          status: "PROCESSING",
          receiptUrl 
        },
      });

      const adminEmail = process.env.ADMIN_EMAIL || "contact@lbassur.bj";
      await this.notificationsService.notifyClientReceipt(quote.email || "", quote.phone, receiptUrl);
      await this.notificationsService.notifyAdminNewQuote(adminEmail, quote.id);
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" }
      });
    }

    return { received: true };
  }
}
