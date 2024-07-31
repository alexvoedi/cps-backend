import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCharacterToSuicideKingDto } from 'src/suicide-king/dtos/add-character-to-suicide-king.dto';
import { MoveCharacterToEndDto } from 'src/suicide-king/dtos/move-character-to-end.dto';
import { MoveCharacterDto } from 'src/suicide-king/dtos/move-character.dto';
import { SetCharacterInactiveDto } from 'src/suicide-king/dtos/set-character-inactive.dto';
import { ListType } from 'src/suicide-king/enums/list-type.enum';

@Injectable()
export class SuicuideKingService {
  constructor(private readonly prisma: PrismaService) {}

  async getList() {
    return this.prisma.suicideKingList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  async addCharacterToRaid(data: Prisma.SuicideKingListUncheckedCreateInput) {
    return await this.prisma.suicideKingList.create({
      data,
    });
  }

  async getCharacterByIdOrThrow(characterId: string) {
    const character = await this.prisma.suicideKingList.findUnique({
      where: {
        characterId,
      },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  async checkPositionValidity() {
    // todo
  }

  async updateList({
    characterId,
    listType,
    toPosition,
    ...options
  }: {
    characterId: string;
    listType: ListType;
    fromPosition?: number;
    toPosition: number;
  }) {
    const fromPosition = options.fromPosition ?? 1_000_000; // A number larger than anything in the list that works with postgres

    const listKey = this.getListKey(listType);

    const [from, to] = [
      Math.min(fromPosition, toPosition),
      Math.max(fromPosition, toPosition),
    ];

    const adjust = fromPosition > toPosition ? 'increment' : 'decrement';

    const suicideKing = await this.prisma.suicideKingList.findMany({
      where: {
        AND: [
          {
            [listKey]: {
              gte: from,
              lte: to,
            },
          },
          {
            NOT: {
              characterId,
            },
          },
        ],
      },
    });

    await this.prisma.$transaction(async (prisma) => {
      if (options.fromPosition) {
        await this.prisma.suicideKingList.update({
          where: {
            characterId,
          },
          data: {
            position: null,
          },
        });
      }

      const sortedList = suicideKing.sort((a, b) =>
        adjust === 'increment'
          ? b.position - a.position
          : a.position - b.position,
      );

      let inactiveCounter = 0;

      for (const item of sortedList) {
        if (!item.active) {
          inactiveCounter++;
          continue;
        }

        await prisma.suicideKingList.update({
          where: {
            characterId: item.characterId,
          },
          data: {
            [listKey]: {
              [adjust]: 1 + inactiveCounter,
            },
          },
        });

        inactiveCounter = Math.max(0, inactiveCounter - 1);
      }

      await prisma.suicideKingList.upsert({
        where: {
          characterId,
        },
        update: {
          [listKey]: toPosition,
        },
        create: {
          characterId,
          [listKey]: toPosition,
        },
      });

      await prisma.suicideKingListHistory.create({
        data: {
          characterId,
          listType,
          from: options.fromPosition,
          to: toPosition,
        },
      });
    });
  }

  async addCharacterToSuicideKing({
    listType,
    ...dto
  }: AddCharacterToSuicideKingDto) {
    const character = await this.prisma.suicideKingList.findUnique({
      where: {
        characterId: dto.characterId,
      },
    });

    if (character) {
      await this.prisma.suicideKingList.update({
        where: {
          characterId: dto.characterId,
        },
        data: {
          active: true,
        },
      });

      await this.moveCharacter({
        listType,
        characterId: dto.characterId,
        fromPosition: character.position,
        toPosition: dto.toPosition,
      });
    } else {
      await this.updateList({
        listType,
        characterId: dto.characterId,
        fromPosition: dto.fromPosition,
        toPosition: dto.toPosition,
      });
    }

    return this.prisma.suicideKingList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  async moveCharacter({ listType, ...dto }: MoveCharacterDto) {
    await this.getCharacterByIdOrThrow(dto.characterId);

    if (dto.fromPosition && dto.toPosition) {
      await this.updateList({
        listType,
        characterId: dto.characterId,
        fromPosition: dto.fromPosition,
        toPosition: dto.toPosition,
      });
    }

    return this.prisma.suicideKingList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  async moveCharacterToEnd({ listType, ...dto }: MoveCharacterToEndDto) {
    const character = await this.getCharacterByIdOrThrow(dto.characterId);

    const listLength = await this.prisma.suicideKingList.count();

    await this.updateList({
      listType,
      characterId: dto.characterId,
      fromPosition: character.position,
      toPosition: listLength,
    });

    return this.prisma.suicideKingList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  getListKey(listType: ListType) {
    return listType === ListType.SuicideKing ? 'position' : 'tSetPosition';
  }

  async setCharacterActive(dto: SetCharacterInactiveDto, active: boolean) {
    await this.getCharacterByIdOrThrow(dto.characterId);

    await this.prisma.suicideKingList.update({
      where: {
        characterId: dto.characterId,
      },
      data: {
        active,
      },
    });

    return this.prisma.suicideKingList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }
}
