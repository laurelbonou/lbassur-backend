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
exports.InsurersController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../common/guards/api-key.guard");
const create_insurer_dto_1 = require("./dto/create-insurer.dto");
const update_insurer_dto_1 = require("./dto/update-insurer.dto");
const insurers_service_1 = require("./insurers.service");
let InsurersController = class InsurersController {
    insurersService;
    constructor(insurersService) {
        this.insurersService = insurersService;
    }
    findAll() {
        return this.insurersService.findAll();
    }
    findBySlug(slug) {
        return this.insurersService.findBySlug(slug);
    }
    create(dto) {
        return this.insurersService.create(dto);
    }
    update(id, dto) {
        return this.insurersService.update(id, dto);
    }
};
exports.InsurersController = InsurersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InsurersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":slug"),
    __param(0, (0, common_1.Param)("slug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InsurersController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_insurer_dto_1.CreateInsurerDto]),
    __metadata("design:returntype", void 0)
], InsurersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_insurer_dto_1.UpdateInsurerDto]),
    __metadata("design:returntype", void 0)
], InsurersController.prototype, "update", null);
exports.InsurersController = InsurersController = __decorate([
    (0, common_1.Controller)("insurers"),
    __metadata("design:paramtypes", [insurers_service_1.InsurersService])
], InsurersController);
//# sourceMappingURL=insurers.controller.js.map