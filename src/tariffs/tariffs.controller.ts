import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiKeyGuard } from "../common/guards/api-key.guard";
import { CreateTariffRuleDto } from "./dto/create-tariff-rule.dto";
import { QueryTariffRulesDto } from "./dto/query-tariff-rules.dto";
import { UpdateTariffRuleDto } from "./dto/update-tariff-rule.dto";
import { TariffsService } from "./tariffs.service";

@Controller("tariffs")
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  findAll(@Query() query: QueryTariffRulesDto) {
    return this.tariffsService.findAll(query);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Body() dto: CreateTariffRuleDto) {
    return this.tariffsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(ApiKeyGuard)
  update(@Param("id") id: string, @Body() dto: UpdateTariffRuleDto) {
    return this.tariffsService.update(id, dto);
  }
}
