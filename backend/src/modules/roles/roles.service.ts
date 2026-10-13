import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Role, type RoleCode } from "./role.entity";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  findAll() {
    return this.roles.find({ order: { code: "ASC" } });
  }

  findByCode(code: RoleCode) {
    return this.roles.findOne({ where: { code } });
  }
}
