import { Module } from "@nestjs/common";
import { DocumentsModule } from "../documents/documents.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
@Module({ imports: [DocumentsModule], controllers: [EventsController], providers: [EventsService] })
export class EventsModule {}
