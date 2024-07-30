import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuicideKingHistoryController } from 'src/suicide-king-history/suicide-king-history.controller';
import { SuicideKingHistoryService } from 'src/suicide-king-history/suicide-king-history.service';

@Module({
  imports: [],
  controllers: [SuicideKingHistoryController],
  providers: [SuicideKingHistoryService, PrismaService],
  exports: [SuicideKingHistoryService],
})
export class SuicideKingHistoryModule {}
