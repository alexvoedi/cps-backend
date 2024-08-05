import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { PriorityListHistoryService } from 'src/priority-list/modules/priority-list-history/priority-list#-history.service';

@Controller('priority-list/history')
export class PriorityHistoryController {
  constructor(
    private readonly priorityListHistoryService: PriorityListHistoryService,
  ) {}

  @Get()
  async getHistory(
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    return await this.priorityListHistoryService.getHistory({
      skip,
      take,
    });
  }
}
