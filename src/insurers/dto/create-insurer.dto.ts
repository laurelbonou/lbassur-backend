import { InsuranceCategory } from "@prisma/client";
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class CreateInsurerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  website?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsArray()
  @IsEnum(InsuranceCategory, { each: true })
  categories: InsuranceCategory[];
}
