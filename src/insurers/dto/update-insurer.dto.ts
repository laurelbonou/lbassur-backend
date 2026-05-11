import { PartialType } from "@nestjs/swagger";
import { CreateInsurerDto } from "./create-insurer.dto";

export class UpdateInsurerDto extends PartialType(CreateInsurerDto) {}
