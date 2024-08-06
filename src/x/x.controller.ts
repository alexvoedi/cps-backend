import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { XService } from './x.service';

@Controller('x')
export class XController {
  constructor(private readonly xService: XService) {}

  @Get(':id')
  getStep(@Param('id') id: string) {
    const step = this.xService.getStepOrThrow(id);

    return this.xService.serializeStep(step);
  }

  @Throttle({
    default: {
      limit: 1,
      ttl: 30_000,
    },
  })
  @Post(':id')
  checkAnswer(@Param('id') id: string, @Body('answer') answer: string) {
    const nextStep = this.xService.checkAnswer(id, answer);

    return this.xService.serializeStep(nextStep);
  }
}
