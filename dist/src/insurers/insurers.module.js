"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsurersModule = void 0;
const common_1 = require("@nestjs/common");
const insurers_controller_1 = require("./insurers.controller");
const insurers_service_1 = require("./insurers.service");
let InsurersModule = class InsurersModule {
};
exports.InsurersModule = InsurersModule;
exports.InsurersModule = InsurersModule = __decorate([
    (0, common_1.Module)({
        controllers: [insurers_controller_1.InsurersController],
        providers: [insurers_service_1.InsurersService],
    })
], InsurersModule);
//# sourceMappingURL=insurers.module.js.map