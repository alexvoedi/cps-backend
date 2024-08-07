import { IsBoolean, IsString } from 'class-validator';

export class SetCharacterActiveDto {
  @IsString()
  characterId: string;

  @IsBoolean()
  active: boolean;
}
