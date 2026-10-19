import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";
import { IsOptionalText } from "../../common/validation";
import { REQUEST_STATUSES, REQUEST_TYPES, type RequestStatus } from "./administrative-request.entity";

const trim = Transform(({ value }) => typeof value === "string" ? value.trim() : value);
const integer = Transform(({ value }) => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value);
export class CreateAdministrativeRequestDto {
  @IsIn(REQUEST_TYPES) type!: typeof REQUEST_TYPES[number];
  @trim @IsString() @MinLength(3) @MaxLength(200) subject!: string;
  @trim @IsString() @MinLength(10) @MaxLength(10000) description!: string;
}
export class RequestPageQuery {
  @IsOptional() @integer @IsInt() @Min(1) page = 1;
  @IsOptional() @integer @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class ListAdministrativeRequestsQuery extends RequestPageQuery {
  @IsIn(["mine", "review"]) view: "mine" | "review" = "mine";
  @IsOptional() @IsIn(REQUEST_TYPES) type?: typeof REQUEST_TYPES[number];
  @IsOptional() @IsIn(REQUEST_STATUSES) status?: RequestStatus;
  @IsOptionalText(100) q?: string;
  @IsOptional() @IsUUID("4") reviewerId?: string;
}
export class AssignRequestReviewerDto {
  @IsUUID("4") reviewerId!: string;
}
export class RequestStatusDto {
  @IsIn(REQUEST_STATUSES) status!: RequestStatus;
  @IsOptionalText(10000) response?: string;
}
export class ExecuteWithdrawalDto {
  @IsUUID("4") requesterId!: string;
  @trim @IsString() @MinLength(10) @MaxLength(10000) response!: string;
}
