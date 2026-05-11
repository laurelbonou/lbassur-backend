import { IsOptional, IsString } from "class-validator";

export class AutoSimulationDto {
  @IsString()
  usage: string;

  @IsString()
  power: string;

  @IsString()
  energy: string;

  @IsString()
  duration: string;

  @IsOptional()
  @IsString()
  zone?: string;
}
