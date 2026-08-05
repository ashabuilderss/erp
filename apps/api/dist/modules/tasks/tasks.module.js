"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksModule = void 0;
const common_1 = require("@nestjs/common");
const tasks_controller_1 = require("./tasks.controller");
const tasks_service_1 = require("./tasks.service");
const task_proof_service_1 = require("./task-proof.service");
const task_extension_service_1 = require("./task-extension.service");
const task_escalation_worker_1 = require("./task-escalation.worker");
const task_warning_worker_1 = require("./task-warning.worker");
const prisma_service_1 = require("../../config/prisma.service");
const approvals_module_1 = require("../approvals/approvals.module");
let TasksModule = class TasksModule {
};
exports.TasksModule = TasksModule;
exports.TasksModule = TasksModule = __decorate([
    (0, common_1.Module)({
        imports: [approvals_module_1.ApprovalsModule],
        controllers: [tasks_controller_1.TasksController],
        providers: [
            prisma_service_1.PrismaService,
            tasks_service_1.TasksService,
            task_proof_service_1.TaskProofService,
            task_extension_service_1.TaskExtensionService,
            task_escalation_worker_1.TaskEscalationWorker,
            task_warning_worker_1.TaskWarningWorker,
        ],
    })
], TasksModule);
//# sourceMappingURL=tasks.module.js.map