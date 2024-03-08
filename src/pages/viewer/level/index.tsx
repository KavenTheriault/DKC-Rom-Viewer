import { ViewerModeBaseProps } from '../types';
import { BitmapCanvas } from '../../../components/bitmap-canvas';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { convertToImageBitmap } from '../../../utils/image-bitmap';
import { readLevel } from '../../../rom-parser/level';

const ScrollDiv = styled.div`
  overflow: scroll;
`;

export const LevelViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [bitmapImage, setBitmapImage] = useState<ImageBitmap>();

  useEffect(() => {
    const levelImage = readLevel(selectedRom.data);

    const loadImage = async () => {
      const res = await convertToImageBitmap(levelImage);
      setBitmapImage(res);
    };
    loadImage();
  }, []);

  return (
    <ScrollDiv>
      <BitmapCanvas
        image={bitmapImage}
        defaultSize={{ width: 256, height: 256 }}
      />
    </ScrollDiv>
  );
};
