import { InsuranceCategory, OfferStatus } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";

export class QueryOffersDto {
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
  maxPremium?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsIn(["premium", "rating", "coverage"])
  sortBy?: "premium" | "rating" | "coverage";
}
