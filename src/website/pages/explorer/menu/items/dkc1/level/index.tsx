import { noop } from 'lodash';
import React, { useEffect, useState } from 'react';
import { buildLevelImageFromEntranceInfo } from '../../../../../../../rom-io/common/levels';
import { loadEntranceInfo } from '../../../../../../../rom-io/common/levels/entrance-info';
import { tryBackground } from '../../../../../../../rom-io/common/levels/entrance-info/test';
import { decodeTilesFromSpec } from '../../../../../../../rom-io/common/levels/spec';
import { buildTerrainTilesetImage } from '../../../../../../../rom-io/common/levels/terrain';
import {
  EntranceInfo,
  LevelInfo,
  TerrainInfo,
} from '../../../../../../../rom-io/common/levels/types';
import {
  Dkc1LevelConstant,
  DKC1_ASSETS,
} from '../../../../../../../rom-io/dkc1/constants';
import { RomAddress } from '../../../../../../../rom-io/rom/address';
import { CollapsiblePanel } from '../../../../../../components/collapsible-panel';
import { HexadecimalInput } from '../../../../../../components/hexadecimal-input';
import { LoadHexadecimalInput } from '../../../../../../components/hexadecimal-input/with-load-button';
import { Menu } from '../../../../../../components/menu';
import { stateSelector, useAppStore } from '../../../../../../state/selector';
import { MainMenuItemComponent } from '../../../../../../types/layout';
import {
  drawImageBitmap,
  getDrawCenterOffset,
} from '../../../../../../utils/draw';
import { convertToImageBitmap } from '../../../../../../utils/image-bitmap';
import { OverlaySlotsContainer } from '../../../../styles';
import { AddressesDiv } from '../styles';
import { EntranceIndexInput } from './index-input';
import { DKC1_LEVELS } from './level-list';
import { Level, LevelItem } from './types';

export const Dkc1Level: MainMenuItemComponent = ({ children }) => {
  const appStore = useAppStore();
  const rom = stateSelector((s) => s.rom);
  const canvasController = stateSelector((s) => s.canvasController);
  if (!rom) return null;

  const entranceIndex = stateSelector((s) => s.dkc1.levelEntranceIndex);
  const setEntranceIndex = (address: number) => {
    appStore.set((s) => {
      s.dkc1.levelEntranceIndex = address;
    });
  };

  const [selectedLevelItem, setSelectedLevelItem] = useState<LevelItem | null>(
    DKC1_LEVELS[0].items[0],
  );
  const [showTilemapOnly, setShowTilemapOnly] = useState<boolean>(false);
  const [entranceInfo, setEntranceInfo] = useState<EntranceInfo>();
  const [levelBitmap, setLevelBitmap] = useState<ImageBitmap>();
  const [error, setError] = useState('');

  const loadLevelFromEntranceId = async (entrance: number) => {
    setError('');

    let info: EntranceInfo | null = null;
    try {
      info = loadEntranceInfo(rom.data, Dkc1LevelConstant, entrance);
      setEntranceInfo(info);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Invalid entrance index',
      );
      setLevelBitmap(undefined);
    }

    if (info) await loadLevelFromEntranceInfo(info);
  };

  const loadLevelFromEntranceInfo = async (info: EntranceInfo) => {
    setError('');

    try {
      const levelImage = showTilemapOnly
        ? buildTerrainTilesetImage(rom.data, info.terrain)
        : buildLevelImageFromEntranceInfo(rom.data, info);
      const bitmap = await convertToImageBitmap(levelImage);
      setLevelBitmap(bitmap);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Invalid entrance info',
      );
      setLevelBitmap(undefined);
    }
  };

  const updateTerrainInfo = (partial: Partial<TerrainInfo>) => {
    if (!entranceInfo) return;
    setEntranceInfo({
      ...entranceInfo,
      terrain: {
        ...entranceInfo.terrain,
        ...partial,
      },
    });
  };

  const updateLevelInfo = (partial: Partial<LevelInfo>) => {
    if (!entranceInfo) return;
    setEntranceInfo({
      ...entranceInfo,
      level: {
        ...entranceInfo.level,
        ...partial,
      },
    });
  };

  const loadLevel = async () => {
    if (!entranceInfo) return;
    await loadLevelFromEntranceInfo(entranceInfo);
  };

  const drawLevelImage = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    if (levelBitmap) {
      const centerOffset = getDrawCenterOffset(canvas, {
        width: levelBitmap.width,
        height: levelBitmap.height,
      });
      drawImageBitmap(context, levelBitmap, centerOffset);
    }
  };

  useEffect(() => {
    canvasController.registerDrawHandler(drawLevelImage);
    canvasController.draw();

    return () => {
      canvasController.unregisterDrawHandler(drawLevelImage);
    };
  }, [levelBitmap]);

  useEffect(() => {
    if (selectedLevelItem) {
      setEntranceIndex(selectedLevelItem.value.entranceIndex);
      loadLevelFromEntranceId(selectedLevelItem.value.entranceIndex).then(noop);
    }
  }, [selectedLevelItem]);

  useEffect(() => {
    loadLevel().then(noop);
  }, [showTilemapOnly]);

  useEffect(() => {
    canvasController.resetTransform();
    loadLevelFromEntranceId(entranceIndex).then(noop);
  }, []);

  return children({
    top: {
      left: (
        <OverlaySlotsContainer>
          <CollapsiblePanel title="Level selection">
            <AddressesDiv>
              <div className="is-flex is-flex-direction-column is-align-items-stretch">
                <label className="label is-small">Level</label>
                <Menu<Level>
                  title="Select level"
                  groups={DKC1_LEVELS}
                  selectedItem={selectedLevelItem}
                  onSelectItem={(item) => {
                    setSelectedLevelItem(item);
                  }}
                />
              </div>
              <EntranceIndexInput
                label="Entrance Index"
                value={entranceIndex}
                onValueChange={(value) => {
                  if (value) setEntranceIndex(value);
                }}
                onValueLoad={async (index) => {
                  setSelectedLevelItem(null);
                  await loadLevelFromEntranceId(index);
                }}
              />
            </AddressesDiv>
          </CollapsiblePanel>
        </OverlaySlotsContainer>
      ),
      middle: (
        <>{error && <div className="notification is-danger">{error}</div>}</>
      ),
      right: entranceInfo && (
        <OverlaySlotsContainer className="is-align-items-end">
          <CollapsiblePanel title="Entrance info">
            <AddressesDiv>
              <LoadHexadecimalInput
                label="Terrain Type Address"
                hexadecimalValue={
                  entranceInfo.terrain.tilemapAddress.snesAddress
                }
                onValueChange={(value) => {
                  if (value === undefined) return;
                  updateTerrainInfo({
                    tilemapAddress: RomAddress.fromSnesAddress(value),
                  });
                }}
                onValueLoad={loadLevel}
              />
              <LoadHexadecimalInput
                label="Palettes Address"
                hexadecimalValue={
                  entranceInfo.terrain.palettesAddress.snesAddress
                }
                onValueChange={(value) => {
                  if (value === undefined) return;
                  updateTerrainInfo({
                    palettesAddress: RomAddress.fromSnesAddress(value),
                  });
                }}
                onValueLoad={loadLevel}
              />
              <HexadecimalInput
                className="input is-small"
                readOnly
                value={entranceInfo.terrain.levelsTilemapStart.snesAddress}
              />
              <LoadHexadecimalInput
                label="Level Tilemap Address"
                hexadecimalValue={entranceInfo.level.tilemapAddress.snesAddress}
                onValueChange={(value) => {
                  if (value === undefined) return;
                  updateLevelInfo({
                    tilemapAddress: RomAddress.fromSnesAddress(value),
                  });
                }}
                onValueLoad={loadLevel}
              />
              <LoadHexadecimalInput
                label="Level Tilemap Offset"
                hexadecimalValue={entranceInfo.level.tilemapOffset}
                onValueChange={(value) => {
                  if (value === undefined) return;
                  updateLevelInfo({
                    tilemapOffset: value,
                  });
                }}
                onValueLoad={loadLevel}
              />
              <LoadHexadecimalInput
                label="Level Tilemap Length"
                hexadecimalValue={entranceInfo.level.tilemapLength}
                onValueChange={(value) => {
                  if (value === undefined) return;
                  updateLevelInfo({
                    tilemapLength: value,
                  });
                }}
                onValueLoad={loadLevel}
              />
            </AddressesDiv>
          </CollapsiblePanel>
          <CollapsiblePanel title="Options">
            <label className="checkbox">
              <input
                className="mr-1"
                type="checkbox"
                value={showTilemapOnly.toString()}
                onChange={() => setShowTilemapOnly(!showTilemapOnly)}
              />
              Show Tilemap Only
            </label>
          </CollapsiblePanel>
          {Object.entries(DKC1_ASSETS).map(([name, spec]) => (
            <button
              onClick={async () => {
                if (!rom) return;
                const image = decodeTilesFromSpec(rom.data, spec, 32);
                const bitmap = await convertToImageBitmap(image);
                setLevelBitmap(bitmap);
              }}
            >
              {name}
            </button>
          ))}
          <button
            onClick={async () => {
              if (!rom || !entranceInfo) return;
              const image = tryBackground(rom.data, entranceInfo, 1);
              const bitmap = await convertToImageBitmap(image);
              setLevelBitmap(bitmap);
            }}
          >
            BG Layer 2
          </button>
          <button
            onClick={async () => {
              if (!rom || !entranceInfo) return;
              const image = tryBackground(rom.data, entranceInfo, 2);
              const bitmap = await convertToImageBitmap(image);
              setLevelBitmap(bitmap);
            }}
          >
            BG Layer 3
          </button>
        </OverlaySlotsContainer>
      ),
    },
  });
};
