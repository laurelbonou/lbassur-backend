import { Body, Controller, Get, Param, Patch, Post, UseGuards, Query, UseInterceptors } from "@nestjs/common";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";
import { InsurersService } from "./insurers.service";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";

@Controller("insurers")
export class InsurersController {
  constructor(private readonly insurersService: InsurersService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  findAll(@Query() query: PaginationQueryDto) {
    return this.insurersService.findAll(query);
  }

  @Get(":slug")
  @UseInterceptors(CacheInterceptor)
  findBySlug(@Param("slug") slug: string) {
    return this.insurersService.findBySlug(slug);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Body() dto: CreateInsurerDto) {
    return this.insurersService.create(dto);
  }

  @Patch(":id")
  @UseGuards(ApiKeyGuard)
  update(@Param("id") id: string, @Body() dto: UpdateInsurerDto) {
    return this.insurersService.update(id, dto);
  }
}
