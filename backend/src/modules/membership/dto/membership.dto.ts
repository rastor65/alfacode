import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

import {
  IsEmailField,
  IsFullName,
  IsNewPassword,
  IsOptionalText,
  IsRoleCode,
  IsSecureToken,
} from "../../../common/validation";
import type { RoleCode } from "../../roles/role.entity";
import { MEMBERSHIP_REQUEST_STATUSES, type MembershipRequestStatus } from "../membership-request.entity";

const toInt = Transform(({ value }) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));

export class ListMembershipRequestsQuery {
  @IsOptional()
  @IsIn(MEMBERSHIP_REQUEST_STATUSES)
  status?: MembershipRequestStatus;

  @toInt
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @toInt
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class ApproveMembershipRequestDto {
  @IsRoleCode()
  roleCode!: RoleCode;

  @IsOptionalText(1000)
  comment?: string;
}

export class RejectMembershipRequestDto {
  @IsOptionalText(1000)
  comment?: string;
}

export class CreateInvitationDto {
  @IsEmailField()
  email!: string;

  @IsRoleCode()
  roleCode!: RoleCode;
}

export class AcceptInvitationDto {
  @IsSecureToken()
  token!: string;

  @IsFullName()
  fullName!: string;

  @IsNewPassword()
  password!: string;
}
