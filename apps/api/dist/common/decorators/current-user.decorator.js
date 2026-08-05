"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentEmployeeId = exports.CurrentCompany = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
});
exports.CurrentCompany = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const company = request.company;
    return data ? company?.[data] : company;
});
exports.CurrentEmployeeId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.employeeId;
});
//# sourceMappingURL=current-user.decorator.js.map