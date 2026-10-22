import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "../academic/academic.entities";
import { EVENT_STATUSES, EVENT_TYPES } from "../events/event.entities";
import { PROJECT_STATUSES, PROJECT_TYPES } from "../projects/project.entity";
import { OBSERVATION_KINDS, type ObservationKind } from "./project-observation.entity";

const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));
const integer = Transform(({ value }) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));
const calendarDate = Matches(/^\d{4}-\d{2}-\d{2}$/);

export class TrackingPageQuery {
  @IsOptional() @integer @IsInt() @Min(1) page = 1;
  @IsOptional() @integer @IsInt() @Min(1) @Max(100) pageSize = 20;
}

export class CreateObservationDto {
  @IsIn(OBSERVATION_KINDS) kind!: ObservationKind;
  @trim @IsString() @MinLength(10) @MaxLength(5000) body!: string;
}

class ReportQuery extends TrackingPageQuery {
  @IsOptional() @calendarDate from?: string;
  @IsOptional() @calendarDate to?: string;
  @IsOptional() @IsUUID("4") researchLineId?: string;
}
export class ProjectReportQuery extends ReportQuery {
  @IsOptional() @IsIn(PROJECT_TYPES) type?: (typeof PROJECT_TYPES)[number];
  @IsOptional() @IsIn(PROJECT_STATUSES) status?: (typeof PROJECT_STATUSES)[number];
}
export class ProductReportQuery extends ReportQuery {
  @IsOptional() @IsIn(PRODUCT_TYPES) type?: (typeof PRODUCT_TYPES)[number];
  @IsOptional() @IsIn(PRODUCT_STATUSES) status?: (typeof PRODUCT_STATUSES)[number];
  @IsOptional() @IsIn(PROJECT_TYPES) projectType?: (typeof PROJECT_TYPES)[number];
}
export class EventReportQuery extends ReportQuery {
  @IsOptional() @IsIn(EVENT_TYPES) type?: (typeof EVENT_TYPES)[number];
  @IsOptional() @IsIn(EVENT_STATUSES) status?: (typeof EVENT_STATUSES)[number];
}
