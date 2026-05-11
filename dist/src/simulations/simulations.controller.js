"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationsController = void 0;
const common_1 = require("@nestjs/common");
const auto_simulation_dto_1 = require("./dto/auto-simulation.dto");
const generic_simulation_dto_1 = require("./dto/generic-simulation.dto");
const simulations_service_1 = require("./simulations.service");
let SimulationsController = class SimulationsController {
    simulationsService;
    constructor(simulationsService) {
        this.simulationsService = simulationsService;
    }
    simulateAuto(dto) {
        return this.simulationsService.simulateAuto(dto);
    }
    simulateGeneric(dto) {
        return this.simulationsService.simulate(dto.category, dto.type, dto.criteria);
    }
};
exports.SimulationsController = SimulationsController;
__decorate([
    (0, common_1.Post)("auto"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auto_simulation_dto_1.AutoSimulationDto]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "simulateAuto", null);
__decorate([
    (0, common_1.Post)("generic"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generic_simulation_dto_1.GenericSimulationDto]),
    __metadata("design:returntype", void 0)
], SimulationsController.prototype, "simulateGeneric", null);
exports.SimulationsController = SimulationsController = __decorate([
    (0, common_1.Controller)("simulations"),
    __metadata("design:paramtypes", [simulations_service_1.SimulationsService])
], SimulationsController);
//# sourceMappingURL=simulations.controller.js.map