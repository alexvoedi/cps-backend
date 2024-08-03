import { ListType } from '@prisma/client';

export class AddCharacterToPriorityListDto {
  characterId: string;
  listType: ListType;
  fromPosition?: number;
  toPosition: number;
}
