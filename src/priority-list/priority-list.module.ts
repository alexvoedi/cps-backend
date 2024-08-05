import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PriorityHistoryModule as PriorityListHistoryModule } from 'src/priority-list/modules/priority-list-history/priority-list-history.module';
import { PriorityListGateway } from './priority-list.gateway';
import { PriorityListService } from './priority-list.service';

@Module({
  imports: [PriorityListHistoryModule],
  providers: [PriorityListService, PriorityListGateway, PrismaService],
  controllers: [],
  exports: [],
})
export class PriorityListModule {}
