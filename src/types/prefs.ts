import type { JsonArray } from './entities';

export type CopiedRow = { row: JsonArray; columnsOrder: string[] };

export type SidebarVisibility = {
  sideDatabases: boolean;
  sideTables: boolean;
  sideQueries: boolean;
};
export type SidebarOptions = keyof SidebarVisibility;
