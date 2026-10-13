import { Body, Controller, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";

import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { type AuthContext, CurrentAuth, Public, RequireRoles } from "../auth/auth.decorators";
import {
  AcceptInvitationDto,
  ApproveMembershipRequestDto,
  CreateInvitationDto,
  ListMembershipRequestsQuery,
  RejectMembershipRequestDto,
} from "./dto/membership.dto";
import { InvitationsService } from "./invitations.service";
import { MembershipRequestsService } from "./membership-requests.service";

const uuid = new ParseUUIDPipe({ version: "4" });

@RequireRoles("admin", "coordinator")
@Controller("membership-requests")
export class MembershipRequestsController {
  constructor(
    @Inject(MembershipRequestsService)
    private readonly requests: MembershipRequestsService,
  ) {}

  @Get()
  list(@Query(new DtoValidationPipe(ListMembershipRequestsQuery)) query: ListMembershipRequestsQuery) {
    return this.requests.list(query);
  }

  @Post(":id/approve")
  @HttpCode(200)
  approve(
    @CurrentAuth() auth: AuthContext,
    @Param("id", uuid) id: string,
    @Body(new DtoValidationPipe(ApproveMembershipRequestDto)) dto: ApproveMembershipRequestDto,
  ) {
    return this.requests.approve(auth.user, id, dto);
  }

  @Post(":id/reject")
  @HttpCode(200)
  reject(
    @CurrentAuth() auth: AuthContext,
    @Param("id", uuid) id: string,
    @Body(new DtoValidationPipe(RejectMembershipRequestDto)) dto: RejectMembershipRequestDto,
  ) {
    return this.requests.reject(auth.user, id, dto);
  }
}

@Controller("invitations")
export class InvitationsController {
  constructor(
    @Inject(InvitationsService)
    private readonly invitations: InvitationsService,
  ) {}

  @RequireRoles("admin", "coordinator")
  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @Body(new DtoValidationPipe(CreateInvitationDto)) dto: CreateInvitationDto,
  ) {
    return this.invitations.create(auth.user, dto);
  }

  @Public()
  @Post("accept")
  accept(@Body(new DtoValidationPipe(AcceptInvitationDto)) dto: AcceptInvitationDto, @Req() request: Request) {
    return this.invitations.accept(dto, request.ip ?? "unknown");
  }
}
