import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { CreateInsurerDto } from "./dto/create-insurer.dto";
import { UpdateInsurerDto } from "./dto/update-insurer.dto";
import { InsurersService } from "./insurers.service";

@Controller("insurers")
export class InsurersController {
  constructor(private readonly insurersService: InsurersService) {}

  @Get()
  findAll() {
    return this.insurersService.findAll();
  }

  @Get(":slug")
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
