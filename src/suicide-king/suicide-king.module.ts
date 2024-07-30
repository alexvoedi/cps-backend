import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuicideKingHistoryModule } from 'src/suicide-king-history/suicide-king-history.module';
import { SuicideKingGateway } from 'src/suicide-king/suicide-king.gateway';
import { SuicuideKingService as SuicideKingService } from 'src/suicide-king/suicide-king.service';

@Module({
  imports: [SuicideKingHistoryModule],
  providers: [SuicideKingService, SuicideKingGateway, PrismaService],
  controllers: [],
  exports: [],
})
export class SuicideKingModule {}
