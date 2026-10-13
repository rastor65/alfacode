import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { CommonModule } from "./common/common.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MailModule } from "./modules/mail/mail.module";
import { MembershipModule } from "./modules/membership/membership.module";
import { RolesModule } from "./modules/roles/roles.module";
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
  ],
})
export class AppModule {}
