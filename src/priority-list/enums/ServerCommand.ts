/**
 * Commands that are sent from the clients to the server.
 */
export enum ServerCommand {
  PriorityList_Add = 'priority-list:add',
  PriorityList_Move = 'priority-list:move',
  PriorityList_MoveToEnd = 'priority-list:move-to-end',
  PriorityList_SetActive = 'priority-list:set-active',
}
