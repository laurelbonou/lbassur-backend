import { IsNotEmpty, IsObject, IsString } from "class-validator";

export class GenericSimulationDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  criteria: any;
}
