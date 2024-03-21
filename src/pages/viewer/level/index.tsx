import { ViewerModeBaseProps } from '../types';
import { BitmapCanvas } from '../../../components/bitmap-canvas';
import styled from 'styled-components';
import { useState } from 'react';
import { convertToImageBitmap } from '../../../utils/image-bitmap';
import { buildLevelImageByEntranceId } from '../../../rom-parser/level';
import { LoadHexadecimalInput } from '../../../components/load-hexadecimal-input';

const ScrollDiv = styled.div`
  overflow: auto;
`;

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [bitmapImage, setBitmapImage] = useState<ImageBitmap>();
  const [entranceIndex, setEntranceIndex] = useState<number | undefined>(0x16);

  const onEntranceIndexLoadClick = () => {
    if (entranceIndex) loadLevelImage(entranceIndex);
  };

  const loadLevelImage = async (entranceId: number) => {
    const levelImage = buildLevelImageByEntranceId(
      selectedRom.data,
      entranceId,
    );

    const imageBitmap = await convertToImageBitmap(levelImage);
    setBitmapImage(imageBitmap);
  };

  return (
    <div>
      <LoadHexadecimalInput
        label="Entrance Index"
        hexadecimalValue={entranceIndex}
        onValueChange={setEntranceIndex}
        onValueLoad={onEntranceIndexLoadClick}
      />
      {bitmapImage && (
        <ScrollDiv>
          <BitmapCanvas image={bitmapImage} />
        </ScrollDiv>
      )}
    </div>
  );
};
