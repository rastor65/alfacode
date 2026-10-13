import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { InvitationsService } from "./invitations.service";
import { InvitationsController, MembershipRequestsController } from "./membership.controllers";
import { MembershipRequestsService } from "./membership-requests.service";

@Module({
  imports: [AuthModule],
  controllers: [MembershipRequestsController, InvitationsController],
  providers: [MembershipRequestsService, InvitationsService],
})
export class MembershipModule {}
