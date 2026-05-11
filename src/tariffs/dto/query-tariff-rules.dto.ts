import { InsuranceCategory } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class QueryTariffRulesDto {
  @IsOptional()
  @IsEnum(InsuranceCategory)
  category?: InsuranceCategory;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  insurerSlug?: string;

  @IsOptional()
  @IsString()
  usage?: string;

  @IsOptional()
  @IsString()
  power?: string;

  @IsOptional()
  @IsString()
  energy?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  active?: string;
}
