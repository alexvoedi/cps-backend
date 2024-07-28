import { Controller, Get } from '@nestjs/common';
import { SuicuideKingService } from 'src/suicide-king/suicide-king.service';

@Controller('suicide-king')
export class SuicideKingController {
  constructor(private readonly suicideKingService: SuicuideKingService) {}

  @Get()
  async getList() {
    return this.suicideKingService.getList();
  }
}
