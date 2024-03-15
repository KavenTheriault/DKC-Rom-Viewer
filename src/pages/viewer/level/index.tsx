import { ViewerModeBaseProps } from '../types';
import { BitmapCanvas } from '../../../components/bitmap-canvas';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { convertToImageBitmap } from '../../../utils/image-bitmap';
import { readRopeyRampageLevel } from '../../../rom-parser/level';
import { LoadHexadecimalInput } from '../../../components/load-hexadecimal-input';
import {
  EntranceInfo,
  entranceInfoToString,
  loadEntranceInfo,
} from '../../../rom-parser/level/addresses';

const ScrollDiv = styled.div`
  overflow: scroll;
`;

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [bitmapImage, setBitmapImage] = useState<ImageBitmap>();
  const [entranceIndex, setEntranceIndex] = useState<number | undefined>(0x16);
  const [entranceInfo, setEntranceInfo] = useState<EntranceInfo>();

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
      const result = loadEntranceInfo(selectedRom.data, entranceIndex);
      setEntranceInfo(result);
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
        {entranceInfo && <pre>{entranceInfoToString(entranceInfo)}</pre>}
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
