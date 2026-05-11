import { InsuranceCategory } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateTariffRuleDto {
  @IsString()
  insurerId: string;

  @IsOptional()
  @IsString()
  offerId?: string;

  @IsOptional()
  @IsString()
  insuranceTypeId?: string;

  @IsEnum(InsuranceCategory)
  category: InsuranceCategory;

  @IsString()
  insuranceTypeLabel: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  vehicleUsage?: string;

  @IsOptional()
  @IsString()
  vehiclePower?: string;

  @IsOptional()
  @IsString()
  vehicleEnergy?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  guarantees?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
