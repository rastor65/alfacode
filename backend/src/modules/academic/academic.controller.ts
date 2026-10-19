import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Put, Query } from "@nestjs/common";
import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { CurrentAuth, type AuthContext } from "../auth/auth.decorators";
import { ListAcademicQuery, SaveProductDto, SaveRecognitionDto } from "./academic.dto";
import { AcademicService } from "./academic.service";
const uuid = new ParseUUIDPipe({ version: "4" });

@Controller("academic-products")
export class AcademicProductsController {
  constructor(@Inject(AcademicService) private readonly service: AcademicService) {}
  @Get() list(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(ListAcademicQuery)) q: ListAcademicQuery) { return this.service.list(a.user, q); }
  @Get(":id") detail(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.product(a.user, id); }
  @Post() create(@CurrentAuth() a: AuthContext, @Body(new DtoValidationPipe(SaveProductDto)) dto: SaveProductDto) { return this.service.saveProduct(a.user, dto); }
  @Put(":id") update(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(SaveProductDto)) dto: SaveProductDto) { return this.service.saveProduct(a.user, dto, id); }
  @Delete(":id") @HttpCode(204) remove(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.remove(a.user, id); }
}

@Controller("recognitions")
export class RecognitionsController {
  constructor(@Inject(AcademicService) private readonly service: AcademicService) {}
  @Get() list(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(ListAcademicQuery)) q: ListAcademicQuery) { return this.service.list(a.user, q, true); }
  @Get(":id") detail(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.recognition(a.user, id); }
  @Post() create(@CurrentAuth() a: AuthContext, @Body(new DtoValidationPipe(SaveRecognitionDto)) dto: SaveRecognitionDto) { return this.service.saveRecognition(a.user, dto); }
  @Put(":id") update(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(SaveRecognitionDto)) dto: SaveRecognitionDto) { return this.service.saveRecognition(a.user, dto, id); }
  @Delete(":id") @HttpCode(204) remove(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.remove(a.user, id, true); }
}
