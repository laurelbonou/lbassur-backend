import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
import { QuoteRequestsService } from "./quote-requests.service";

@Controller("quote-requests")
export class QuoteRequestsController {
  constructor(private readonly quoteRequestsService: QuoteRequestsService) {}

  @Get()
  @UseGuards(ApiKeyGuard)
  findAll() {
    return this.quoteRequestsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateQuoteRequestDto) {
    return this.quoteRequestsService.create(dto);
  }
}
