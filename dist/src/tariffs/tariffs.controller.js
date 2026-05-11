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
exports.TariffsController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../common/guards/api-key.guard");
const create_tariff_rule_dto_1 = require("./dto/create-tariff-rule.dto");
const query_tariff_rules_dto_1 = require("./dto/query-tariff-rules.dto");
const update_tariff_rule_dto_1 = require("./dto/update-tariff-rule.dto");
const tariffs_service_1 = require("./tariffs.service");
let TariffsController = class TariffsController {
    tariffsService;
    constructor(tariffsService) {
        this.tariffsService = tariffsService;
    }
    findAll(query) {
        return this.tariffsService.findAll(query);
    }
    create(dto) {
        return this.tariffsService.create(dto);
    }
    update(id, dto) {
        return this.tariffsService.update(id, dto);
    }
};
exports.TariffsController = TariffsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_tariff_rules_dto_1.QueryTariffRulesDto]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tariff_rule_dto_1.CreateTariffRuleDto]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tariff_rule_dto_1.UpdateTariffRuleDto]),
    __metadata("design:returntype", void 0)
], TariffsController.prototype, "update", null);
exports.TariffsController = TariffsController = __decorate([
    (0, common_1.Controller)("tariffs"),
    __metadata("design:paramtypes", [tariffs_service_1.TariffsService])
], TariffsController);
//# sourceMappingURL=tariffs.controller.js.map