import { Controller, Get } from '@nestjs/common';
import { PriorityListService } from './priority-list.service';

@Controller('priority-list')
export class PriorityListController {
  constructor(private readonly priorityListService: PriorityListService) {}

  @Get()
  async getList() {
    return this.priorityListService.getList();
  }
}
