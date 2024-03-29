import { FullscreenCanvas } from '../components/fullscreen-canvas';
import React, { useEffect, useRef, useState } from 'react';
import { CanvasController } from '../components/fullscreen-canvas/canvas-controller';
import { SelectedRom } from '../types/selected-rom';
import { ViewerState } from './viewer';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router';
import { LoadHexadecimalInput } from '../components/load-hexadecimal-input';
import { buildLevelImageByEntranceId } from '../rom-parser/level';
import { convertToImageBitmap } from '../utils/image-bitmap';
import { ClickableContainer } from '../components/fullscreen-canvas/styles';

export interface CanvasTestState {
  selectedRom: SelectedRom;
}

export const CanvasTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasController = useRef<CanvasController>(new CanvasController());

  const bitmapImage = useRef<ImageBitmap>();
  const [entranceIndex, setEntranceIndex] = useState<number | undefined>(0x16);

  const viewerState = location.state
    ? (location.state as ViewerState)
    : undefined;

  useEffect(() => {
    if (!viewerState?.selectedRom) {
      navigate('/');
    }

    canvasController.current.onDraw(draw);
  }, []);

  const draw = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    if (!bitmapImage.current) return;
    context.drawImage(
      bitmapImage.current,
      canvas.width / 2 - bitmapImage.current.width / 2,
      canvas.height / 2 - bitmapImage.current.height / 2,
    );
  };

  const onEntranceIndexLoadClick = async () => {
    if (!entranceIndex) return;
    await loadLevelImage(entranceIndex);
  };

  const loadLevelImage = async (entranceId: number) => {
    const levelImage = buildLevelImageByEntranceId(
      viewerState!.selectedRom.data,
      entranceId,
    );
    bitmapImage.current = await convertToImageBitmap(levelImage);
    canvasController.current.draw();
  };

  return (
    <FullscreenCanvas
      canvasController={canvasController.current}
      slots={{
        top: {
          left: (
            <ClickableContainer>
              <LoadHexadecimalInput
                label="Entrance Index"
                hexadecimalValue={entranceIndex}
                onValueChange={setEntranceIndex}
                onValueLoad={onEntranceIndexLoadClick}
              />
            </ClickableContainer>
          ),
        },
      }}
    />
  );
};
