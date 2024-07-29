import { CharacterClass, CharacterRole } from '@prisma/client';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(12)
  name: string;

  @IsString()
  @IsNotEmpty()
  class: CharacterClass;

  @IsArray()
  roles: CharacterRole[];
}
