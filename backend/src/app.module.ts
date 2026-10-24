import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { CommonModule } from "./common/common.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AcademicModule } from "./modules/academic/academic.module";
import { EventsModule } from "./modules/events/events.module";
import { AdministrationModule } from "./modules/administration/administration.module";
import { TrackingModule } from "./modules/tracking/tracking.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { MailModule } from "./modules/mail/mail.module";
import { MembershipModule } from "./modules/membership/membership.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { ResearchModule } from "./modules/research/research.module";
import { RolesModule } from "./modules/roles/roles.module";
import { SprintsModule } from "./modules/sprints/sprints.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env.local", ".env"],
      // Las pruebas (`node --test`) no deben leer la configuracion local de quien las ejecuta.
      ignoreEnvFile: Boolean(process.env.NODE_TEST_CONTEXT),
      isGlobal: true,
    }),
    CommonModule,
    MailModule,
    DatabaseModule,
    HealthModule,
    UsersModule,
    RolesModule,
    AuthModule,
    MembershipModule,
    ProjectsModule,
    TasksModule,
    SprintsModule,
    ResearchModule,
    DocumentsModule,
    AcademicModule,
    EventsModule,
    AdministrationModule,
    TrackingModule,
  ],
})
export class AppModule {}
