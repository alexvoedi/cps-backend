import { Module } from '@nestjs/common';
import { CharacterController } from 'src/character/character.controller';
import { CharacterService } from 'src/character/character.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [CharacterController],
  providers: [CharacterService, PrismaService],
})
export class CharacterModule {}
