import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuicideKingGateway } from 'src/suicide-king/suicide-king.gateway';
import { SuicuideKingService as SuicideKingService } from 'src/suicide-king/suicide-king.service';

@Module({
  imports: [],
  providers: [SuicideKingService, SuicideKingGateway, PrismaService],
  controllers: [],
  exports: [],
})
export class SuicideKingModule {}
