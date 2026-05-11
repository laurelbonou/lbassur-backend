import { PartialType } from "@nestjs/swagger";
import { CreateTariffRuleDto } from "./create-tariff-rule.dto";

export class UpdateTariffRuleDto extends PartialType(CreateTariffRuleDto) {}
