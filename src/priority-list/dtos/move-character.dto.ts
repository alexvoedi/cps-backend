import { ListType } from '@prisma/client';

export class MoveCharacterDto {
  characterId: string;
  listType: ListType;
  fromPosition: number;
  toPosition: number;
}
