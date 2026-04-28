import { Buffer } from '../../../types/buffer';
import { GameLevelConstant, Layer, TerrainInfo } from '../types';
import { OpcodeEntry } from './asm/read';
import { readVramRegisters } from './vram-registers';

export const buildLayersInfo = (
  romData: Buffer,
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

  const levelLayer = backgroundRegisters.layers.find(
    (l) => l.tilemapAddress === terrainInfo.levelsTilemapVramAddress,
  );
  const terrainTilesetAddress = levelLayer
    ? levelLayer.tilesetAddress
    : undefined;

  for (const layer of backgroundRegisters.layers) {
    if (!layer.tilesetAddress) continue; // Layer is empty

    let type: Layer['type'];
    if (layer === levelLayer) {
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
