import { ViewerModeBaseProps } from '../types';
import { BitmapCanvas } from '../../../components/bitmap-canvas';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { convertToImageBitmap } from '../../../utils/image-bitmap';
import { readRopeyRampageLevel } from '../../../rom-parser/level';
import { LoadHexadecimalInput } from '../../../components/load-hexadecimal-input';
import { toHexString } from '../../../utils/hex';
import { loadTerrainMetaIndex } from '../../../rom-parser/level/addresses';

const ScrollDiv = styled.div`
  overflow: scroll;
`;

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [bitmapImage, setBitmapImage] = useState<ImageBitmap>();
  const [entranceIndex, setEntranceIndex] = useState<number | undefined>(0x16);
  const [terrainMetaIndex, setTerrainMetaIndex] = useState<number>();

  useEffect(() => {
    const levelImage = readRopeyRampageLevel(selectedRom.data);

    const loadImage = async () => {
      const res = await convertToImageBitmap(levelImage);
      setBitmapImage(res);
    };
    loadImage();
  }, []);

  const onTerrainMetaIndexLoadClick = () => {
    if (entranceIndex) {
      const result = loadTerrainMetaIndex(selectedRom.data, entranceIndex);
      setTerrainMetaIndex(result);
    }
  };

  return (
    <div>
      <div>
        <LoadHexadecimalInput
          label="Entrance Index"
          hexadecimalValue={entranceIndex}
          onValueChange={setEntranceIndex}
          onValueLoad={onTerrainMetaIndexLoadClick}
        />
        {terrainMetaIndex && (
          <pre>{toHexString(terrainMetaIndex, { addPrefix: true })}</pre>
        )}
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
