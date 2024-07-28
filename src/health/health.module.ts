import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "src/health/health.controller";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
  providers: [PrismaService],
  exports: []
})
export class HealthModule { }
