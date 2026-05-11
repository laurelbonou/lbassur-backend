"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInsurerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_insurer_dto_1 = require("./create-insurer.dto");
class UpdateInsurerDto extends (0, swagger_1.PartialType)(create_insurer_dto_1.CreateInsurerDto) {
}
exports.UpdateInsurerDto = UpdateInsurerDto;
//# sourceMappingURL=update-insurer.dto.js.map