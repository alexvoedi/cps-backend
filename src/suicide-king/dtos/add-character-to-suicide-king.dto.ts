import { ListType } from 'src/suicide-king/enums/list-type.enum';

export class AddCharacterToSuicideKingDto {
  characterId: string;
  listType: ListType;
  position: number;
}
