import { Transform } from "class-transformer";
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUrl, IsUUID, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { IsOptionalText } from "../../common/validation";
import { ATTENDANCE_STATUSES, EVENT_MODES, EVENT_STATUSES, EVENT_TYPES, PARTICIPANT_ROLES } from "./event.entities";
const trim = Transform(({ value }) => typeof value === "string" ? value.trim() : value);
const integer = Transform(({ value }) => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value);
const offset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;
export class SaveEventDto {
  @trim @IsString() @MinLength(3) @MaxLength(200) title!: string;
  @IsOptionalText(10000) description?: string;
  @IsIn(EVENT_TYPES) type!: typeof EVENT_TYPES[number];
  @IsIn(EVENT_MODES) mode!: typeof EVENT_MODES[number];
  @IsISO8601({ strict: true }) @Matches(offset) startsAt!: string;
  @IsISO8601({ strict: true }) @Matches(offset) endsAt!: string;
  @IsUUID("4") organizerId!: string;
  @IsOptional() @IsUUID("4") projectId?: string;
  @IsOptionalText(500) location?: string;
  @IsOptional() @trim @IsUrl({ protocols: ["http", "https"], require_protocol: true }) @MaxLength(2000) url?: string;
  @IsOptionalText(200) externalOrganizer?: string;
  @IsOptionalText(10000) requirements?: string;
  @IsOptional() @trim @IsUrl({ protocols: ["http", "https"], require_protocol: true }) @MaxLength(2000) registrationUrl?: string;
}
export class EventStatusDto {
  @IsIn(EVENT_STATUSES) status!: typeof EVENT_STATUSES[number];
  @IsOptionalText(1000) reason?: string;
}
export class ParticipantDto {
  @IsUUID("4") userId!: string;
  @IsIn(PARTICIPANT_ROLES) role: typeof PARTICIPANT_ROLES[number] = "participant";
}
export class AttendanceDto {
  @IsIn(ATTENDANCE_STATUSES) attendance!: typeof ATTENDANCE_STATUSES[number];
}
export class EventDocumentDto {
  @IsUUID("4") documentId!: string;
}
export class EventPageQuery {
  @IsOptional() @integer @IsInt() @Min(1) page = 1;
  @IsOptional() @integer @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class ListEventsQuery extends EventPageQuery {
  @IsOptionalText(100) q?: string;
  @IsOptional() @IsIn(EVENT_TYPES) type?: typeof EVENT_TYPES[number];
  @IsOptional() @IsIn(EVENT_STATUSES) status?: typeof EVENT_STATUSES[number];
  @IsOptional() @IsUUID("4") projectId?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
}
