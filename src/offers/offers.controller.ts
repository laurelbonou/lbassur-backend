import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { QueryOffersDto } from "./dto/query-offers.dto";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { UpdateOfferDto } from "./dto/update-offer.dto";
import { OffersService } from "./offers.service";

@Controller("offers")
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  findAll(@Query() query: QueryOffersDto & PaginationQueryDto) {
    return this.offersService.findAll(query);
  }

  @Get(":id")
  @UseInterceptors(CacheInterceptor)
  findOne(@Param("id") id: string) {
    return this.offersService.findOne(id);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Body() dto: CreateOfferDto) {
    return this.offersService.create(dto);
  }

  @Patch(":id")
  @UseGuards(ApiKeyGuard)
  update(@Param("id") id: string, @Body() dto: UpdateOfferDto) {
    return this.offersService.update(id, dto);
  }
}
