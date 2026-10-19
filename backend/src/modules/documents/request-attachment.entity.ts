import { Column, Entity, PrimaryColumn } from "typeorm";

/** Vinculo exclusivo a un tramite; el archivo y sus metadatos siguen en Gestion documental. */
@Entity({ name: "administrative_request_documents" })
export class RequestAttachment {
  @PrimaryColumn({ name: "document_id", type: "varchar", length: 36 }) documentId!: string;
  @Column({ name: "request_id", type: "varchar", length: 36 }) requestId!: string;
}
