import { GameLevelConstant, Layer, TerrainInfo } from '../types';
import { OpcodeEntry } from './asm/read';
import { readVramRegisters } from './vram-registers';

export const buildLayersInfo = (
  romData: Uint8Array,
  levelConstant: GameLevelConstant,
  opcodeEntries: OpcodeEntry[],
  terrainInfo: TerrainInfo,
): Layer[] => {
  const layers: Layer[] = [];
  const backgroundRegisters = readVramRegisters(
    romData,
    levelConstant,
    opcodeEntries,
  );

  let terrainTilesetAddress;
  for (const layer of backgroundRegisters.layers) {
    if (!layer.tilesetAddress) continue; // Layer is empty

    if (terrainTilesetAddress === undefined) {
      terrainTilesetAddress = layer.tilesetAddress;
    }

    let type: Layer['type'];
    if (layer.tilemapAddress === terrainInfo.levelsTilemapVramAddress) {
      type = 'Level';
    } else if (layer.tilesetAddress === terrainTilesetAddress) {
      type = 'Tileset';
    } else {
      type = 'Image';
    }

    layers.push({ type, ...layer });
  }
  return layers;
};
