import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PriorityHistoryController as PriorityListHistoryController } from 'src/priority-list-history/priority-list-history.controller';
import { PriorityListHistoryService } from 'src/priority-list-history/priority-list#-history.service';

@Module({
  imports: [],
  controllers: [PriorityListHistoryController],
  providers: [PriorityListHistoryService, PrismaService],
  exports: [PriorityListHistoryService],
})
export class PriorityHistoryModule {}
