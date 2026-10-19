import { Module } from "@nestjs/common";
import { DocumentsModule } from "../documents/documents.module";
import { AcademicProductsController, RecognitionsController } from "./academic.controller";
import { AcademicService } from "./academic.service";
@Module({ imports: [DocumentsModule], controllers: [AcademicProductsController, RecognitionsController], providers: [AcademicService] })
export class AcademicModule {}
