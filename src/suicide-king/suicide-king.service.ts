import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SuicuideKingService {
  constructor(private readonly prisma: PrismaService) {}

  async getList() {}
}
