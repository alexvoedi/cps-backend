import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CharacterService } from 'src/character/character.service';
import { CreateCharacterDto } from 'src/character/dtos/create-character.dto';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  async getAllCharacters() {
    return this.characterService.getCharacters({});
  }

  @Post()
  async createCharacter(@Body() data: CreateCharacterDto) {
    return this.characterService.createCharacter(data);
  }

  @Delete(':id')
  async deleteCharacter(@Param('id') id: string) {
    return this.characterService.deleteCharacter(id);
  }
}
