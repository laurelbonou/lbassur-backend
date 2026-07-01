import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { BrokersService } from "./brokers.service";
import { CreateBrokerDto, UpdateBrokerDto } from "./dto/broker.dto";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";

@Controller("brokers")
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  // ── Public Routes ──────────────────────────────────────────────────────────

  /**
   * Look up a broker by their code.
   * Used by the frontend during subscription flow to validate a broker code.
   */
  @Get("lookup/:code")
  @UseInterceptors(CacheInterceptor)
  lookupByCode(@Param("code") code: string) {
    return this.brokersService.findByCode(code);
  }

  // ── Admin Routes ───────────────────────────────────────────────────────────

  @Get()
  @UseGuards(ApiKeyGuard)
  findAll(@Query() query: PaginationQueryDto) {
    return this.brokersService.findAll(query);
  }

  @Get("commissions")
  @UseGuards(ApiKeyGuard)
  getCommissions(@Query() query: PaginationQueryDto & { brokerId?: string; status?: string }) {
    return this.brokersService.getCommissionSummary(query);
  }

  @Get(":slug")
  @UseGuards(ApiKeyGuard)
  findBySlug(@Param("slug") slug: string) {
    return this.brokersService.findBySlug(slug);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Body() dto: CreateBrokerDto) {
    return this.brokersService.create(dto);
  }

  @Patch(":id")
  @UseGuards(ApiKeyGuard)
  update(@Param("id") id: string, @Body() dto: UpdateBrokerDto) {
    return this.brokersService.update(id, dto);
  }
}
