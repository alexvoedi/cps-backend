import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCharacterToSuicideKingDto } from 'src/suicide-king/dtos/add-character-to-suicide-king.dto';
import { MoveCharacterToEndDto } from 'src/suicide-king/dtos/move-character-to-end.dto';
import { MoveCharacterDto } from 'src/suicide-king/dtos/move-character.dto';
import { SetCharacterInactiveDto } from 'src/suicide-king/dtos/set-character-inactive.dto';
import { ListType } from 'src/suicide-king/enums/list-type.enum';

@Injectable()
export class SuicuideKingService {
  private readonly logger = new Logger(SuicuideKingService.name);

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
    const changes: Array<{
      name: string;
      from: number;
      to: number;
    }> = [];

    const fromPosition = options.fromPosition > 0 ? options.fromPosition : null;

    const listKey = this.getListKey(listType);

    const suicideKing = await this.prisma.suicideKingList.findMany({
      where: {
        AND: [
          {
            [listKey]: this.getUpdateRange(fromPosition, toPosition),
          },
          {
            NOT: {
              characterId,
            },
          },
        ],
      },
      orderBy: {
        [listKey]: 'asc',
      },
    });

    const suicideKingActive = suicideKing.filter((item) => item.active);
    const suicideKingInactive = suicideKing.filter((item) => !item.active);

    const isPositionLocked = (position: number) =>
      suicideKingInactive.some((item) => item[listKey] === position);

    const direction = fromPosition && fromPosition < toPosition ? -1 : 1;

    await this.prisma.$transaction(
      async (prisma) => {
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

        changes.push({
          name: characterId,
          from: fromPosition,
          to: toPosition,
        });

        for (const entry of suicideKingActive) {
          let newPosition = entry[listKey] + direction;

          while (isPositionLocked(newPosition)) {
            newPosition += direction;
          }

          await prisma.suicideKingList.update({
            where: {
              characterId: entry.characterId,
            },
            data: {
              [listKey]: newPosition,
            },
          });

          changes.push({
            name: entry.characterId,
            from: entry[listKey],
            to: newPosition,
          });
        }

        await prisma.suicideKingListHistory.create({
          data: {
            characterId,
            listType,
            from: options.fromPosition,
            to: toPosition,
          },
        });

        await this.checkListConsistency(prisma, listType);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    changes.forEach((change) => {
      this.logger.verbose(
        `Moved ${change.name} from ${change.from} to ${change.to}`,
      );
    });
  }

  private getUpdateRange(fromPosition: number | null, toPosition: number) {
    const gte = Math.min(
      fromPosition > 0 ? fromPosition : toPosition,
      toPosition,
    );

    const lte = fromPosition
      ? Math.max(fromPosition > 0 ? fromPosition : toPosition, toPosition)
      : null;

    const range = {
      gte,
    };

    if (lte) {
      range['lte'] = lte;
    }

    return range;
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

  async checkListConsistency(
    prisma: Omit<PrismaClient, ITXClientDenyList>,
    listType: ListType,
  ) {
    const listKey = this.getListKey(listType);

    const list = await prisma.suicideKingList.findMany({
      orderBy: {
        [listKey]: 'asc',
      },
    });

    if (list.length === 0) {
      return;
    }

    const positions = new Set();

    for (let i = 1; i <= list.length; i++) {
      const entry = list[i - 1];

      if (positions.has(entry[listKey])) {
        throw new BadRequestException(
          `Character ${entry.characterId} has a duplicate position`,
        );
      }

      if (entry[listKey] !== i) {
        throw new BadRequestException(
          `Character ${entry.characterId} has an incorrect position`,
        );
      }

      positions.add(entry[listKey]);
    }
  }
}
