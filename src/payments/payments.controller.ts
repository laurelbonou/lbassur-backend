import { Controller, Post, Body, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

class SimulatePaymentDto {
  quoteRequestId: string;
  method: string;
}

@Controller("payments")
export class PaymentsController {
  constructor(private readonly prisma: PrismaService) {}

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

    // Update QuoteRequest status
    await this.prisma.quoteRequest.update({
      where: { id: quote.id },
      data: { status: "CONVERTED" },
    });

    return {
      success: true,
      payment,
    };
  }
}
