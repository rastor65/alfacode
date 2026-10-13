import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from "@nestjs/common";

import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { SessionsService } from "./sessions.service";

/** Borra periodicamente las sesiones vencidas (F1-07). */
@Injectable()
export class SessionCleanupService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger("SessionCleanup");
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(SessionsService)
    private readonly sessions: SessionsService,
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  onApplicationBootstrap() {
    if (this.config.sessionCleanupIntervalMs === 0) {
      return;
    }

    this.timer = setInterval(() => void this.run(), this.config.sessionCleanupIntervalMs);
    this.timer.unref();
  }

  onApplicationShutdown() {
    clearInterval(this.timer);
  }

  async run() {
    try {
      const deleted = await this.sessions.deleteExpired();

      if (deleted > 0) {
        this.logger.log(`Expired sessions deleted: ${deleted}`);
      }
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    }
  }
}
