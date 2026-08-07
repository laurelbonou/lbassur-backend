import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsInt,
  Min,
  Max,
  MinLength,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { IntermediaryType } from "@prisma/client";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

export class CreateBrokerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(IntermediaryType)
  type?: IntermediaryType;

  /** Obligatoire pour un AGENT_GENERAL, interdit pour un COURTIER. */
  @IsOptional()
  @IsString()
  insurerId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  approvalRank?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  approvalYear?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  platformRate?: number;
}

export class UpdateBrokerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  platformRate?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class QueryBrokersDto extends PaginationQueryDto {
  /** Recherche libre : nom, ville ou code. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(IntermediaryType)
  type?: IntermediaryType;

  /**
   * Compagnie concernée par la souscription. Filtre les agents généraux
   * pour ne garder que ceux habilités à distribuer ses produits.
   */
  @IsOptional()
  @IsString()
  insurerSlug?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class SetInsurerCodeDto {
  @IsString()
  insurerId: string;

  @IsString()
  @MinLength(1)
  code: string;
}
