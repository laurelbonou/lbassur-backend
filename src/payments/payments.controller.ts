import { Controller, Post, Body, BadRequestException, NotFoundException, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { NotificationsService } from "../notifications/notifications.service";
import { FeexPayWebhookGuard } from "./guards/feexpay-webhook.guard";
import { Logger } from "nestjs-pino";
import { Throttle } from '@nestjs/throttler';

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
    private readonly logger: Logger,
  ) {}

  @Post("initialize")
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Limit to 10 init requests per minute
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
      amount = Number((quote.payload as any).price) || 0;
    }

    const reference = `LB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

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

    const shopId = process.env.FEEXPAY_SHOP_ID || "MOCK_SHOP_ID";
    const feexPayUrl = `https://api.feexpay.me/pay?shop_id=${shopId}&amount=${amount}&reference=${reference}&callback_info=${quote.id}`;

    return {
      success: true,
      paymentUrl: feexPayUrl,
      reference,
    };
  }

  @Post("webhook")
  @UseGuards(FeexPayWebhookGuard)
  async feexpayWebhook(@Body() body: any) {
    const { reference, status, customId, callback_info } = body;
    
    if (!reference) throw new BadRequestException("Missing reference");

    const quoteId = customId || callback_info || body.custom_id;

    // Strict idempotency via $transaction
    const result = await this.prisma.$transaction(async (tx) => {
      let payment = await tx.payment.findUnique({
        where: { reference },
        include: { quoteRequest: true },
      });

      if (!payment && quoteId) {
        const quote = await tx.quoteRequest.findUnique({ where: { id: quoteId } });
        if (quote) {
          payment = await tx.payment.create({
            data: {
              quoteRequestId: quote.id,
              amount: quote.budget || 0,
              method: "FEEXPAY",
              status: "PENDING",
              reference: reference,
            },
            include: { quoteRequest: true }
          });
        }
      }

      if (!payment) throw new NotFoundException("Payment not found");
      if (payment.status === "SUCCESS") return { alreadyProcessed: true };

      if (status === "SUCCESS" || status === "SUCCESSFUL" || status === "COMPLETED") {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS" }
        });

        const quote = payment.quoteRequest;
        
        await tx.quoteRequest.update({
          where: { id: quote.id },
          data: { status: "PROCESSING" },
        });

        return { payment, quote, status: 'SUCCESS' };
      } else {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" }
        });
        return { status: 'FAILED' };
      }
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    if (result.alreadyProcessed) {
      return { received: true };
    }

    if (result.status === 'SUCCESS' && result.payment && result.quote) {
      const { payment, quote } = result;

      const fullQuote = await this.prisma.quoteRequest.findUnique({
        where: { id: quote.id },
        include: { documents: true },
      });

      const receiptUrl = await this.documentsService.generateReceipt(quote, payment);
      
      await this.prisma.quoteRequest.update({
        where: { id: quote.id },
        data: { receiptUrl },
      });

      const adminEmail = process.env.ADMIN_EMAIL || "contact@lbassur.bj";
      await this.notificationsService.notifyClientReceipt(quote.email || "", quote.phone, receiptUrl).catch(e => this.logger.error(e));
      await this.notificationsService.notifyAdminNewQuote(adminEmail, quote.id).catch(e => this.logger.error(e));
      
      await this.notificationsService.notifyInsurerAfterPayment(quote, fullQuote?.documents || []).catch(err => {
        this.logger.error({ err }, "Failed to notify insurer after payment");
      });
    }

    return { received: true };
  }
}
