import { InsuranceCategory } from "@prisma/client";
import { IsEmail, IsEnum, IsNumber, IsObject, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateQuoteRequestDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  phone: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEnum(InsuranceCategory)
  category?: InsuranceCategory;

  @IsOptional()
  @IsString()
  insuranceType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  selectedOfferId?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  documents?: {
    type: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }[];

  @IsOptional()
  @IsString()
  signatureData?: string;

  @IsOptional()
  @IsString()
  brokerCode?: string;
}
