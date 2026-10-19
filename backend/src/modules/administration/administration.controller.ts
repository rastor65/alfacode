import { Body, Controller, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { CurrentAuth, type AuthContext } from "../auth/auth.decorators";
import { AssignRequestReviewerDto, CreateAdministrativeRequestDto, ExecuteWithdrawalDto, ListAdministrativeRequestsQuery, RequestPageQuery, RequestStatusDto } from "./administrative-request.dto";
import { AdministrationService } from "./administration.service";
import { WithdrawalService } from "./withdrawal.service";
const uuid = new ParseUUIDPipe({ version: "4" });

@Controller("administrative-requests")
export class AdministrationController {
  constructor(@Inject(AdministrationService) private readonly service: AdministrationService,
    @Inject(WithdrawalService) private readonly withdrawal: WithdrawalService) {}
  @Get() list(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(ListAdministrativeRequestsQuery)) q: ListAdministrativeRequestsQuery) { return this.service.list(a.user, q); }
  @Post() create(@CurrentAuth() a: AuthContext, @Body(new DtoValidationPipe(CreateAdministrativeRequestDto)) dto: CreateAdministrativeRequestDto) { return this.service.create(a.user, dto); }
  @Get("reviewers") reviewers(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(RequestPageQuery)) q: RequestPageQuery) { return this.service.reviewers(a.user, q); }
  @Get(":id") detail(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.detail(a.user, id); }
  @Get(":id/history") history(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Query(new DtoValidationPipe(RequestPageQuery)) q: RequestPageQuery) { return this.service.history(a.user, id, q); }
  @Patch(":id/reviewer") assign(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(AssignRequestReviewerDto)) dto: AssignRequestReviewerDto) { return this.service.assign(a.user, id, dto.reviewerId); }
  @Post(":id/status") @HttpCode(200) status(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(RequestStatusDto)) dto: RequestStatusDto) { return this.service.status(a.user, id, dto); }
  @Get(":id/withdrawal") preview(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Query(new DtoValidationPipe(RequestPageQuery)) q: RequestPageQuery) { return this.withdrawal.preview(a.user, id, q); }
  @Post(":id/withdrawal") @HttpCode(200) execute(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(ExecuteWithdrawalDto)) dto: ExecuteWithdrawalDto) { return this.withdrawal.execute(a.user, id, dto); }
}
