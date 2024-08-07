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
import { PriorityListHistoryService } from 'src/priority-list/modules/priority-list-history/priority-list#-history.service';
import { AddCharacterToPriorityListDto } from './dtos/add-character-to-priority-list.dto';
import { MoveCharacterToEndDto } from './dtos/move-character-to-end.dto';
import { MoveCharacterDto } from './dtos/move-character.dto';
import { SetCharacterActiveDto } from './dtos/set-character-active.dto';
import { PriorityListService } from './priority-list.service';
import { ClientCommand } from './enums/ClientCommand';
import { ServerCommand } from './enums/ServerCommand';

@WebSocketGateway({
  namespace: 'priority-list',
  cors: {
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://cps.nekatz.com',
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

    client.emit('priority-list:update', priorityList);
    client.emit('priority-list-history:update', priorityListHistory);

    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @Roles([UserRole.RaidLead])
  @SubscribeMessage(ServerCommand.PriorityList_Add)
  async addToPriorityList(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: AddCharacterToPriorityListDto,
  ) {
    this.logger.verbose(`add-to-priority-list: ${JSON.stringify(body)}`);

    const priorityList = await this.priorityListService.addToPriorityList(body);
    const historyEntry = await this.priorityListHistoryService.getNewestEntry();

    this.server.emit(ClientCommand.PriorityList_Update, priorityList);
    this.server.emit(ClientCommand.PriorityListHistory_Add, historyEntry);
  }

  @Roles([UserRole.RaidLead])
  @SubscribeMessage(ServerCommand.PriorityList_Move)
  async moveCharacter(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: MoveCharacterDto,
  ) {
    this.logger.verbose(`move: ${JSON.stringify(body)}`);

    const priorityList = await this.priorityListService.moveCharacter(body);
    const historyEntry = await this.priorityListHistoryService.getNewestEntry();

    this.server.emit(ClientCommand.PriorityList_Update, priorityList);
    this.server.emit(ClientCommand.PriorityListHistory_Add, historyEntry);
  }

  @Roles([UserRole.RaidLead])
  @SubscribeMessage(ServerCommand.PriorityList_MoveToEnd)
  async moveToEnd(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: MoveCharacterToEndDto,
  ) {
    this.logger.verbose(`move-to-end: ${JSON.stringify(body)}`);

    const priorityList =
      await this.priorityListService.moveCharacterToEnd(body);
    const historyEntry = await this.priorityListHistoryService.getNewestEntry();

    this.server.emit(ClientCommand.PriorityList_Update, priorityList);
    this.server.emit(ClientCommand.PriorityListHistory_Add, historyEntry);
  }

  @Roles([UserRole.RaidLead])
  @SubscribeMessage(ServerCommand.PriorityList_SetActive)
  async toggleCharacterActive(
    @MessageBody({
      transform: (value) => JSON.parse(value),
    })
    body: SetCharacterActiveDto,
  ) {
    this.logger.verbose(`set-character-inactive: ${JSON.stringify(body)}`);

    const priorityList =
      await this.priorityListService.setCharacterActive(body);
    const historyEntry = await this.priorityListHistoryService.getNewestEntry();

    this.server.emit(ClientCommand.PriorityList_Update, priorityList);
    this.server.emit(ClientCommand.PriorityListHistory_Add, historyEntry);
  }
}
