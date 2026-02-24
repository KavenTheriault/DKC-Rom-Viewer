import { noop } from 'lodash';
import React, { useEffect, useState } from 'react';
import { buildLevelImageFromEntranceInfo } from '../../../../../../../rom-io/common/levels';
import { loadEntranceInfo } from '../../../../../../../rom-io/common/levels/entrance-info';
import { buildLayer } from '../../../../../../../rom-io/common/levels/layers';
import { decodeTilesFromSpec } from '../../../../../../../rom-io/common/levels/spec';
import { buildTerrainTilesetImage } from '../../../../../../../rom-io/common/levels/terrain';
import { DecodeTileOptions } from '../../../../../../../rom-io/common/levels/tiles/decode-tile';
import {
  EntranceInfo,
  LevelInfo,
  TerrainInfo,
} from '../../../../../../../rom-io/common/levels/types';
import {
  DKC1_ASSETS,
  Dkc1LevelConstant,
} from '../../../../../../../rom-io/dkc1/constants';
import { RomAddress } from '../../../../../../../rom-io/rom/address';
import { CollapsiblePanel } from '../../../../../../components/collapsible-panel';
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
import { OptionsContainer, RadioText } from './styles';
import { Level, LevelItem } from './types';

type DisplayMode = {
  mode: 'Level' | 'Tilemap' | 'Layer';
  layerIndex?: number;
};
const defaultDisplayMode: DisplayMode = { mode: 'Level' };
const defaultDecodeTileOptions: DecodeTileOptions = { opaqueZero: true };

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
    null,
  );
  const [entranceInfo, setEntranceInfo] = useState<EntranceInfo>();
  const [levelBitmap, setLevelBitmap] = useState<ImageBitmap>();
  const [displayMode, setDisplayMode] =
    useState<DisplayMode>(defaultDisplayMode);
  const [decodeTileOptions, setDecodeTileOptions] = useState<DecodeTileOptions>(
    defaultDecodeTileOptions,
  );
  const [error, setError] = useState('');

  const loadLevelFromEntranceId = async (entrance: number) => {
    setError('');
    setDisplayMode(defaultDisplayMode);

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

    if (info) await loadFromEntranceInfoAndMode(info);
  };

  const loadFromEntranceInfoAndMode = async (info: EntranceInfo) => {
    setError('');

    try {
      let imageMatrix;
      switch (displayMode.mode) {
        case 'Level':
          imageMatrix = buildLevelImageFromEntranceInfo(
            rom.data,
            info,
            decodeTileOptions,
          );
          break;
        case 'Tilemap':
          imageMatrix = buildTerrainTilesetImage(
            rom.data,
            info.terrain,
            decodeTileOptions,
          );
          break;
        case 'Layer':
          if (displayMode.layerIndex === undefined) return;
          imageMatrix = buildLayer(
            rom.data,
            info,
            displayMode.layerIndex,
            decodeTileOptions,
          );
          break;
      }

      const bitmap = await convertToImageBitmap(imageMatrix);
      setLevelBitmap(bitmap);
    } catch (error) {
      console.error(error);
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
    await loadFromEntranceInfoAndMode(entranceInfo);
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
    if (!entranceInfo) return;
    loadFromEntranceInfoAndMode(entranceInfo).then(noop);
  }, [displayMode, decodeTileOptions]);

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
                label="Terrain Tilemap Address"
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
              <LoadHexadecimalInput
                label="Levels Tilemap Address"
                hexadecimalValue={
                  entranceInfo.terrain.levelsTilemapAddress.snesAddress
                }
                onValueChange={(value) => {
                  if (value === undefined) return;
                  updateTerrainInfo({
                    levelsTilemapAddress: RomAddress.fromSnesAddress(value),
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
          <CollapsiblePanel title="Layer">
            <OptionsContainer>
              {entranceInfo.layers.map((l, i) => {
                const layerDisplayMode: DisplayMode =
                  l.type === 'Level'
                    ? { mode: 'Level' }
                    : { mode: 'Layer', layerIndex: i };
                return (
                  <label>
                    <input
                      type="radio"
                      name="displayMode"
                      value={l.type}
                      checked={
                        displayMode.mode === layerDisplayMode.mode &&
                        displayMode.layerIndex === layerDisplayMode.layerIndex
                      }
                      onChange={() => setDisplayMode(layerDisplayMode)}
                    />
                    <RadioText>
                      Layer {i + 1}: {l.type}
                    </RadioText>
                  </label>
                );
              })}
              <label>
                <input
                  type="radio"
                  name="displayMode"
                  value="tilemap"
                  checked={displayMode.mode === 'Tilemap'}
                  onChange={() => setDisplayMode({ mode: 'Tilemap' })}
                />
                <RadioText>Tilemap</RadioText>
              </label>
            </OptionsContainer>
          </CollapsiblePanel>
          <CollapsiblePanel title="Options">
            <OptionsContainer>
              <label className="checkbox">
                <input
                  className="mr-1"
                  type="checkbox"
                  checked={decodeTileOptions.opaqueZero}
                  onChange={() =>
                    setDecodeTileOptions({
                      ...decodeTileOptions,
                      opaqueZero: !decodeTileOptions.opaqueZero,
                    })
                  }
                />
                Fill background
              </label>
              <label className="checkbox">
                <input
                  className="mr-1"
                  type="checkbox"
                  checked={decodeTileOptions.skipBackgroundTiles}
                  onChange={() =>
                    setDecodeTileOptions({
                      ...decodeTileOptions,
                      skipBackgroundTiles:
                        !decodeTileOptions.skipBackgroundTiles,
                    })
                  }
                />
                Foreground only
              </label>
              <label className="checkbox">
                <input
                  className="mr-1"
                  type="checkbox"
                  checked={decodeTileOptions.skipForegroundTiles}
                  onChange={() =>
                    setDecodeTileOptions({
                      ...decodeTileOptions,
                      skipForegroundTiles:
                        !decodeTileOptions.skipForegroundTiles,
                    })
                  }
                />
                Background only
              </label>
              {Object.entries(DKC1_ASSETS).map(([name, spec]) => (
                <button
                  className="button is-small"
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
            </OptionsContainer>
          </CollapsiblePanel>
        </OverlaySlotsContainer>
      ),
    },
  });
};
