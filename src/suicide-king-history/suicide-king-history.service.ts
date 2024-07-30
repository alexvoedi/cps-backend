import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SuicideKingHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.SuicideKingListHistoryWhereUniqueInput;
    where?: Prisma.SuicideKingListHistoryWhereInput;
  }) {
    const { skip, take, cursor, where } = params;
    return this.prisma.suicideKingListHistory.findMany({
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
    return this.prisma.suicideKingListHistory.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 1,
    });
  }
}
