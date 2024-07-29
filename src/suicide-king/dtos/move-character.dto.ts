import { ListType } from 'src/suicide-king/enums/list-type.enum';

export class MoveCharacterDto {
  characterId: string;
  listType: ListType;
  fromPosition: number;
  toPosition: number;
}
