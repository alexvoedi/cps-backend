import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CharacterService } from 'src/character/character.service';
import { CharacterValidationDto } from 'src/character/dtos/character-validation.dto';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  async getAllCharacters() {
    return this.characterService.getCharacters({});
  }

  @Post()
  async createCharacter(@Body() data: CharacterValidationDto) {
    return this.characterService.createCharacter(data);
  }

  @Delete(':id')
  async deleteCharacter(@Param('id') id: string) {
    return this.characterService.deleteCharacter(id);
  }
}
