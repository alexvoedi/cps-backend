/**
 * Commands that are sent from the server to the client.
 */
export enum ClientCommand {
  PriorityList_Update = 'priority-list:update',
  PriorityListHistory_Update = 'priority-list-history:update',
  PriorityListHistory_Add = 'priority-list-history:add',
}
