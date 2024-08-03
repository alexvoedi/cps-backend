import { ListType } from '@prisma/client';

export class MoveCharacterToEndDto {
  characterId: string;
  listType: ListType;
}
