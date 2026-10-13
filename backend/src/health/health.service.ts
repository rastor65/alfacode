import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getHealth() {
    await this.dataSource.query("SELECT 1");

    return {
      status: "ok",
      service: "alfacode-hub-api",
      database: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
