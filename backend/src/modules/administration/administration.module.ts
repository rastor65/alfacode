import { Module } from "@nestjs/common";
import { AdministrationController } from "./administration.controller";
import { AdministrationService } from "./administration.service";
import { WithdrawalService } from "./withdrawal.service";

@Module({ controllers: [AdministrationController], providers: [AdministrationService, WithdrawalService] })
export class AdministrationModule {}
