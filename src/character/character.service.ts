import { Injectable } from '@nestjs/common';
import { Character, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async getCharacters(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CharacterWhereUniqueInput;
    where?: Prisma.CharacterWhereInput;
    orderBy?: Prisma.CharacterOrderByWithRelationInput;
  }): Promise<Character[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.character.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createCharacter(data: Prisma.CharacterCreateInput): Promise<Character> {
    const newCharacter = this.prisma.character.create({
      data,
    });

    return newCharacter;
  }

  async deleteCharacter(id: string): Promise<Character> {
    return this.prisma.character.delete({
      where: { id },
    });
  }
}
