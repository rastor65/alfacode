import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";

import { loadDatabaseEnv } from "../../database/database.options";
import { DocumentsController } from "./documents.controller";
import { DOCUMENTS_CONFIG, DocumentsService } from "./documents.service";
import { type DocumentsConfig, STORAGE_SERVICE, createStorage, loadDocumentsConfig } from "./storage";

@Module({
  imports: [
    // Sin `storage` ni `dest`, multer guarda en memoria: el archivo se valida antes de escribirlo.
    MulterModule.registerAsync({
      useFactory: () => {
        loadDatabaseEnv();
        const config = loadDocumentsConfig();
        // `fileSize` + 1: el servicio responde un 413 propio si el archivo pasa del limite.
        return {
          limits: { fileSize: config.maxBytes + 1, files: 1, fields: 10, fieldSize: 20_000, parts: 12 },
          // Los navegadores envian el nombre del archivo en UTF-8; multer asume latin1 por defecto.
          defParamCharset: "utf8",
        };
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [
    {
      provide: DOCUMENTS_CONFIG,
      useFactory: () => {
        loadDatabaseEnv();
        return loadDocumentsConfig();
      },
    },
    { provide: STORAGE_SERVICE, useFactory: (config: DocumentsConfig) => createStorage(config), inject: [DOCUMENTS_CONFIG] },
    DocumentsService,
  ],
})
export class DocumentsModule {}
