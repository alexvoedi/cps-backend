import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { SuicideKingHistoryService } from 'src/suicide-king-history/suicide-king-history.service';

@Controller('suicide-king/history')
export class SuicideKingHistoryController {
  constructor(
    private readonly suicideKingHistoryService: SuicideKingHistoryService,
  ) {}

  @Get()
  async getHistory(
    @Query('skip', ParseIntPipe) skip: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    return await this.suicideKingHistoryService.getHistory({
      skip,
      take,
    });
  }
}
