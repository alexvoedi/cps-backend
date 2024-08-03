import { Logger } from '@nestjs/common';
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
import { PriorityListHistoryService } from 'src/priority-list-history/priority-list#-history.service';
import { AddCharacterToListDto } from './dtos/add-character-to-list.dto';
import { AddCharacterToPriorityListDto } from './dtos/add-character-to-priority-list.dto';
import { MoveCharacterToEndDto } from './dtos/move-character-to-end.dto';
import { MoveCharacterDto } from './dtos/move-character.dto';
import { SetCharacterInactiveDto } from './dtos/set-character-active.dto';
import { PriorityListService } from './priority-list.service';

@WebSocketGateway({
  namespace: 'priority-list',
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://alexvoedi.github.io',
    ],
    credentials: true,
  },
})
export class PriorityListGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PriorityListGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly priorityListService: PriorityListService,
    private readonly priorityListHistoryService: PriorityListHistoryService,
  ) {}

  afterInit() {
    this.logger.log('Gateway initialized and listening');
  }

  async handleConnection(client: Socket) {
    const priorityList = await this.priorityListService.getList();
    const priorityListHistory =
      await this.priorityListHistoryService.getHistory({
        take: 10,
      });

    client.emit('update-priority-list', priorityList);
    client.emit('update-priority-list-history', priorityListHistory);

    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('add-character-to-list')
  async addCharacterToRaid(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: AddCharacterToListDto,
  ) {
    this.logger.verbose(`add-character-to-list: ${JSON.stringify(body)}`);

    const result = await this.priorityListService.addCharacterToRaid(body);

    this.server.emit('update-priority-list', result);
    this.server.emit(
      'add-priority-list-history-entry',
      await this.priorityListHistoryService.getNewestEntry(),
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

    const result = await this.priorityListService.moveCharacter(body);

    this.server.emit('update-priority-list', result);
    this.server.emit(
      'add-priority-list-history-entry',
      await this.priorityListHistoryService.getNewestEntry(),
    );
  }

  @SubscribeMessage('add-to-priority-list')
  async addCharacterToPriority(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: AddCharacterToPriorityListDto,
  ) {
    this.logger.verbose(`add-to-priority-list: ${JSON.stringify(body)}`);

    const result =
      await this.priorityListService.addCharacterToPriorityList(body);

    this.server.emit('update-priority-list', result);
    this.server.emit(
      'add-priority-list-history-entry',
      await this.priorityListHistoryService.getNewestEntry(),
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

    const result = await this.priorityListService.moveCharacterToEnd(body);

    this.server.emit('update-priority-list', result);
    this.server.emit(
      'add-priority-list-history-entry',
      await this.priorityListHistoryService.getNewestEntry(),
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

    const result = await this.priorityListService.setCharacterActive(
      body,
      false,
    );

    this.server.emit('update-priority-list', result);
  }

  @SubscribeMessage('set-character-active')
  async setCharacterActive(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: SetCharacterInactiveDto,
  ) {
    this.logger.verbose(`set-character-active: ${JSON.stringify(body)}`);

    const result = await this.priorityListService.setCharacterActive(
      body,
      true,
    );

    this.server.emit('update-priority-list', result);
  }
}
