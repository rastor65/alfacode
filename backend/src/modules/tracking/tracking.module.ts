import { Module } from "@nestjs/common";
import { ObservationsService } from "./observations.service";
import { ReportsService } from "./reports.service";
import { ObservationsController, TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";
@Module({ controllers: [TrackingController, ObservationsController], providers: [TrackingService, ReportsService, ObservationsService] })
export class TrackingModule {}
