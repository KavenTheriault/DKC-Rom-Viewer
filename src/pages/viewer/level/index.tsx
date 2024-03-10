import { ViewerModeBaseProps } from '../types';
import { BitmapCanvas } from '../../../components/bitmap-canvas';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { convertToImageBitmap } from '../../../utils/image-bitmap';
import {
  readJungleHijinxsLevel,
  readLevelSize,
  readRopeyRampageLevel,
} from '../../../rom-parser/level';
import { LoadHexadecimalInput } from '../../../components/load-hexadecimal-input';
import { toHexString } from '../../../utils/hex';

const ScrollDiv = styled.div`
  overflow: scroll;
`;

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [bitmapImage, setBitmapImage] = useState<ImageBitmap>();
  const [entranceIndex, setEntranceIndex] = useState<number | undefined>(0x16);
  const [levelSize, setLevelSize] = useState<number>();

  useEffect(() => {
    const levelImage = readRopeyRampageLevel(selectedRom.data);

    const loadImage = async () => {
      const res = await convertToImageBitmap(levelImage);
      setBitmapImage(res);
    };
    loadImage();
  }, []);

  const onEntranceIndexLoadClick = () => {
    if (entranceIndex) {
      const result = readLevelSize(selectedRom.data, entranceIndex);
      setLevelSize(result);
    }
  };

  return (
    <div>
      <div>
        <LoadHexadecimalInput
          label="Entrance Index"
          hexadecimalValue={entranceIndex}
          onValueChange={setEntranceIndex}
          onValueLoad={onEntranceIndexLoadClick}
        />
        {levelSize && <pre>{toHexString(levelSize)}</pre>}
      </div>
      <ScrollDiv>
        <BitmapCanvas
          image={bitmapImage}
          defaultSize={{ width: 256, height: 256 }}
        />
      </ScrollDiv>
    </div>
  );
};
