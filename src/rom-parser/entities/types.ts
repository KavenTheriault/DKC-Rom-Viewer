/* Script Commands
   Ref: http://www.dkc-atlas.com/forum/viewtopic.php?f=26&t=2413&p=43098&hilit=8000
* */
import { RomAddress } from '../types/address';

export enum EntityCommand {
  END = 0x8000,
  ANIMATION = 0x8100,
  INHERIT = 0x8200,
  NOP = 0x8300,
  RIGHTWARD = 0x8400,
  H_FLIP = 0x8500,
  V_FLIP = 0x8600,
  LEFTWARD = 0x8700,
  PALETTE = 0x8800,
  PRIORITY_0 = 0x8900,
  PRIORITY_1 = 0x8a00,
  PRIORITY_2 = 0x8b00,
  PRIORITY_3 = 0x8c00,
  UNKNOWN_0 = 0x8d00,
  SET_OAM = 0x8e00,
  UNKNOWN_1 = 0x8f00,
  UNKNOWN_2 = 0x9000,
  PALETTE_INDEX = 0x9100,
  UNKNOWN_3 = 0x9200,
  UNKNOWN_4 = 0x9300,
  UNKNOWN_5 = 0x9400,
  EXECUTE = 0x9500,
  UNKNOWN_6 = 0x9600,
  SET_OAM_2 = 0x9700,
}

export const EntityCommandParametersCount: Record<EntityCommand, number> = {
  [EntityCommand.END]: 0,
  [EntityCommand.ANIMATION]: 1,
  [EntityCommand.INHERIT]: 1,
  [EntityCommand.NOP]: 0,
  [EntityCommand.RIGHTWARD]: 0,
  [EntityCommand.H_FLIP]: 0,
  [EntityCommand.V_FLIP]: 0,
  [EntityCommand.LEFTWARD]: 0,
  [EntityCommand.PALETTE]: 1,
  [EntityCommand.PRIORITY_0]: 0,
  [EntityCommand.PRIORITY_1]: 0,
  [EntityCommand.PRIORITY_2]: 0,
  [EntityCommand.PRIORITY_3]: 0,
  [EntityCommand.UNKNOWN_0]: 0,
  [EntityCommand.SET_OAM]: 1,
  [EntityCommand.UNKNOWN_1]: 2,
  [EntityCommand.UNKNOWN_2]: 2,
  [EntityCommand.PALETTE_INDEX]: 1,
  [EntityCommand.UNKNOWN_3]: 2,
  [EntityCommand.UNKNOWN_4]: 0,
  [EntityCommand.UNKNOWN_5]: 3,
  [EntityCommand.EXECUTE]: 1,
  [EntityCommand.UNKNOWN_6]: 1,
  [EntityCommand.SET_OAM_2]: 1,
};

export type Entity = {
  address: RomAddress;
  length: number;
  instructions: EntityInstruction[];
  inheritEntities: Entity[];
};

export type EntityInstruction = {
  command: number;
  parameters: number[];
};
