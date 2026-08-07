import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { BrokersService } from "./brokers.service";
import {
  CreateBrokerDto,
  UpdateBrokerDto,
  QueryBrokersDto,
  SetInsurerCodeDto,
} from "./dto/broker.dto";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";

@Controller("brokers")
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  /**
   * Liste des intermédiaires proposée au client pendant la souscription.
   * Passer `insurerSlug` pour n'afficher que les agents généraux habilités
   * sur cette compagnie (les courtiers, eux, restent toujours listés).
   */
  @Get("public")
  @UseInterceptors(CacheInterceptor)
  findPublic(@Query() query: QueryBrokersDto) {
    return this.brokersService.findPublic(query);
  }

  /** Vérifie un code saisi par le client. `insurerSlug` lève l'ambiguïté. */
  @Get("lookup/:code")
  @UseInterceptors(CacheInterceptor)
  lookupByCode(@Param("code") code: string, @Query("insurerSlug") insurerSlug?: string) {
    return this.brokersService.resolveByCode(code, insurerSlug);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(ApiKeyGuard)
  findAll(@Query() query: QueryBrokersDto) {
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

  /** Attribue le code de cet intermédiaire chez une compagnie donnée. */
  @Post(":id/codes")
  @UseGuards(ApiKeyGuard)
  setInsurerCode(@Param("id") id: string, @Body() dto: SetInsurerCodeDto) {
    return this.brokersService.setInsurerCode(id, dto.insurerId, dto.code);
  }
}
