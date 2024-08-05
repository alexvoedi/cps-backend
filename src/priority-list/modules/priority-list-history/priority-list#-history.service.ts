import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PriorityListHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PriorityListHistoryWhereUniqueInput;
    where?: Prisma.PriorityListHistoryWhereInput;
  }) {
    const { skip, take, cursor, where } = params;
    return this.prisma.priorityListHistory.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async getNewestEntry() {
    return this.prisma.priorityListHistory.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 1,
    });
  }
}
