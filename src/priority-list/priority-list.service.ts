import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ListType, Prisma, PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCharacterToPriorityListDto } from './dtos/add-character-to-priority-list.dto';
import { MoveCharacterToEndDto } from './dtos/move-character-to-end.dto';
import { MoveCharacterDto } from './dtos/move-character.dto';
import { SetCharacterInactiveDto } from './dtos/set-character-active.dto';

@Injectable()
export class PriorityListService {
  private readonly logger = new Logger(PriorityListService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getList() {
    return this.prisma.priorityList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  async getCharacterByIdOrThrow(characterId: string) {
    const character = await this.prisma.priorityList.findUnique({
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

    const priorityList = await this.prisma.priorityList.findMany({
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

    const priorityListActive = priorityList.filter((item) => item.active);
    const priorityListInactive = priorityList.filter((item) => !item.active);

    const isPositionLocked = (position: number) =>
      priorityListInactive.some((item) => item[listKey] === position);

    const direction = fromPosition && fromPosition < toPosition ? -1 : 1;

    await this.prisma.$transaction(
      async (prisma) => {
        await prisma.priorityList.upsert({
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

        for (const entry of priorityListActive) {
          let newPosition = entry[listKey] + direction;

          while (isPositionLocked(newPosition)) {
            newPosition += direction;
          }

          await prisma.priorityList.update({
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

        await prisma.priorityListHistory.create({
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

  async addToPriorityList({ listType, ...dto }: AddCharacterToPriorityListDto) {
    const character = await this.prisma.priorityList.findUnique({
      where: {
        characterId: dto.characterId,
      },
    });

    if (character) {
      await this.prisma.priorityList.update({
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

    return this.prisma.priorityList.findMany({
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

    return this.prisma.priorityList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  async moveCharacterToEnd({ listType, ...dto }: MoveCharacterToEndDto) {
    const character = await this.getCharacterByIdOrThrow(dto.characterId);

    const listLength = await this.prisma.priorityList.count();

    await this.updateList({
      listType,
      characterId: dto.characterId,
      fromPosition: character.position,
      toPosition: listLength,
    });

    return this.prisma.priorityList.findMany({
      orderBy: {
        position: 'asc',
      },
    });
  }

  getListKey(listType: ListType) {
    return listType === ListType.Item ? 'position' : 'tSetPosition';
  }

  async setCharacterActive(dto: SetCharacterInactiveDto, active: boolean) {
    await this.getCharacterByIdOrThrow(dto.characterId);

    await this.prisma.priorityList.update({
      where: {
        characterId: dto.characterId,
      },
      data: {
        active,
      },
    });

    return this.prisma.priorityList.findMany({
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

    const list = await prisma.priorityList.findMany({
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
