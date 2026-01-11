import { noop } from 'lodash';
import { useEffect, useState } from 'react';
import { buildLevelImageByEntranceId } from '../../../../../../../rom-io/common/levels';
import { Dkc1LevelConstant } from '../../../../../../../rom-io/dkc1/constants';
import { CollapsiblePanel } from '../../../../../../components/collapsible-panel';
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
import { LevelSelector } from './level-selector';

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

  const [levelBitmap, setLevelBitmap] = useState<ImageBitmap>();
  const [error, setError] = useState('');

  const loadLevel = async (entrance: number) => {
    setError('');

    try {
      const levelImage = buildLevelImageByEntranceId(
        rom.data,
        Dkc1LevelConstant,
        entrance,
      );

      const bitmap = await convertToImageBitmap(levelImage);
      setLevelBitmap(bitmap);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Invalid entrance index',
      );
      setLevelBitmap(undefined);
    }
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
    canvasController.resetTransform();
    loadLevel(entranceIndex).then(noop);
  }, []);

  return children({
    top: {
      left: (
        <OverlaySlotsContainer>
          <CollapsiblePanel title="Level selection">
            <AddressesDiv>
              <div className="is-flex is-flex-direction-column is-align-items-stretch">
                <label className="label is-small">Level</label>
                <LevelSelector
                  onSelectLevel={async (level) => {
                    setEntranceIndex(level.entranceIndex);
                    await loadLevel(level.entranceIndex);
                  }}
                />
              </div>
              <EntranceIndexInput
                label="Entrance Index"
                value={entranceIndex}
                onValueChange={(value) => {
                  if (value) setEntranceIndex(value);
                }}
                onValueLoad={(index) => loadLevel(index)}
              />
            </AddressesDiv>
          </CollapsiblePanel>
        </OverlaySlotsContainer>
      ),
      middle: (
        <>{error && <div className="notification is-danger">{error}</div>}</>
      ),
    },
  });
};
