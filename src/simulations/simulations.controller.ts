import { Body, Controller, Post } from "@nestjs/common";
import { AutoSimulationDto } from "./dto/auto-simulation.dto";
import { GenericSimulationDto } from "./dto/generic-simulation.dto";
import { SimulationsService } from "./simulations.service";

@Controller("simulations")
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post("auto")
  simulateAuto(@Body() dto: AutoSimulationDto) {
    return this.simulationsService.simulateAuto(dto);
  }

  @Post("generic")
  simulateGeneric(@Body() dto: GenericSimulationDto) {
    return this.simulationsService.simulate(dto.category, dto.type, dto.criteria);
  }
}
