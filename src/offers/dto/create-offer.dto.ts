import { BillingPeriod, InsuranceCategory, OfferStatus } from "@prisma/client";
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

export class CreateOfferDto {
  @IsEnum(InsuranceCategory)
  category: InsuranceCategory;

  @IsOptional()
  @IsString()
  insuranceTypeId?: string;

  @IsString()
  insuranceTypeLabel: string;

  @IsOptional()
  @IsString()
  insuranceSubType?: string;

  @IsString()
  insurerId: string;

  @IsNumber()
  @Min(0)
  premium: number;

  @IsOptional()
  @IsEnum(BillingPeriod)
  billingPeriod?: BillingPeriod;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsNumber()
  @Min(0)
  coverageAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  franchise?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  guarantees?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionalGuarantees?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  waitingPeriod?: string;

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
