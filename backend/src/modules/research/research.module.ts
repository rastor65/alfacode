import { Module } from "@nestjs/common";

import { ProjectResearchService } from "./project-research.service";
import { ProjectResearchController, ResearchLinesController } from "./research.controllers";
import { ResearchLinesService } from "./research-lines.service";

@Module({
  controllers: [ResearchLinesController, ProjectResearchController],
  providers: [ResearchLinesService, ProjectResearchService],
})
export class ResearchModule {}
