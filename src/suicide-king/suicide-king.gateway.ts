import { Logger, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SuicideKingHistoryService } from 'src/suicide-king-history/suicide-king-history.service';
import { AddCharacterToListDto } from 'src/suicide-king/dtos/add-character-to-list.dto';
import { AddCharacterToSuicideKingDto } from 'src/suicide-king/dtos/add-character-to-suicide-king.dto';
import { MoveCharacterToEndDto } from 'src/suicide-king/dtos/move-character-to-end.dto';
import { MoveCharacterDto } from 'src/suicide-king/dtos/move-character.dto';
import { SetCharacterInactiveDto } from 'src/suicide-king/dtos/set-character-inactive.dto';
import { SuicuideKingService } from 'src/suicide-king/suicide-king.service';

@WebSocketGateway({
  namespace: 'suicide-king',
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://alexvoedi.github.io',
    ],
    credentials: true,
  },
})
export class SuicideKingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SuicideKingGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly suicideKingService: SuicuideKingService,
    private readonly suicideKingHistory: SuicideKingHistoryService,
  ) {}

  afterInit() {
    this.logger.log('SuicideKingGateway initialized and listening');
  }

  async handleConnection(client: Socket) {
    const suicideKingList = await this.suicideKingService.getList();
    const suicideKingHistory = await this.suicideKingHistory.getHistory({
      take: 10,
    });

    client.emit('update-suicide-king-list', suicideKingList);
    client.emit('update-suicide-king-history', suicideKingHistory);

    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('update-raid-list')
  async getList() {}

  @SubscribeMessage('add-character-to-list')
  async addCharacterToRaid(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: AddCharacterToListDto,
  ) {
    this.logger.verbose(`add-character-to-list: ${JSON.stringify(body)}`);

    const result = await this.suicideKingService.addCharacterToRaid(body);

    this.server.emit('update-suicide-king-list', result);
    this.server.emit(
      'add-suicide-king-history-entry',
      await this.suicideKingHistory.getNewestEntry(),
    );
  }

  @Roles([UserRole.RaidLead])
  @SubscribeMessage('move-character')
  async moveCharacter(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: MoveCharacterDto,
  ) {
    this.logger.verbose(`move-character: ${JSON.stringify(body)}`);

    const result = await this.suicideKingService.moveCharacter(body);

    this.server.emit('update-suicide-king-list', result);
    this.server.emit(
      'add-suicide-king-history-entry',
      await this.suicideKingHistory.getNewestEntry(),
    );
  }

  @SubscribeMessage('add-to-suicide-king')
  async addCharacterToSuicideKing(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: AddCharacterToSuicideKingDto,
  ) {
    this.logger.verbose(`add-to-suicide-king: ${JSON.stringify(body)}`);

    const result =
      await this.suicideKingService.addCharacterToSuicideKing(body);

    this.server.emit('update-suicide-king-list', result);
    this.server.emit(
      'add-suicide-king-history-entry',
      await this.suicideKingHistory.getNewestEntry(),
    );
  }

  @SubscribeMessage('move-to-end')
  async moveCharacterToEnd(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: MoveCharacterToEndDto,
  ) {
    this.logger.verbose(`move-to-end: ${JSON.stringify(body)}`);

    const result = await this.suicideKingService.moveCharacterToEnd(body);

    this.server.emit('update-suicide-king-list', result);
    this.server.emit(
      'add-suicide-king-history-entry',
      await this.suicideKingHistory.getNewestEntry(),
    );
  }

  @SubscribeMessage('set-character-inactive')
  async setCharacterInactive(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: SetCharacterInactiveDto,
  ) {
    this.logger.verbose(`set-character-inactive: ${JSON.stringify(body)}`);

    const result = await this.suicideKingService.setCharacterActive(
      body,
      false,
    );

    this.server.emit('update-suicide-king-list', result);
  }

  @SubscribeMessage('set-character-active')
  async setCharacterActive(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: SetCharacterInactiveDto,
  ) {
    this.logger.verbose(`set-character-active: ${JSON.stringify(body)}`);

    const result = await this.suicideKingService.setCharacterActive(body, true);

    this.server.emit('update-suicide-king-list', result);
  }
}
