import { useEffect, useRef } from 'react';
import { Image } from '../rom-parser/sprites/types';
import { rgbToHex } from '../utils/hex';
import styled from 'styled-components';

interface SpriteCanvasProps {
  image?: Image;
  defaultSize: { width: number; height: number };
}

const BorderedCanvas = styled.canvas<{ color: string }>`
  border: 1px solid;
  border-radius: 8px;
  box-shadow: 5px 5px 5px darkgray;
  background-color: ${(props) => props.color};
`;

export const SimpleCanvas = ({ image, defaultSize }: SpriteCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = image ? image.width : defaultSize.width;
      canvas.height = image ? image.height : defaultSize.height;

      const context = canvas.getContext('2d');
      if (context) {
        if (image) drawImage(context, image);
      }
    }
  }, [image]);

  const drawImage = (context: CanvasRenderingContext2D, imageToDraw: Image) => {
    for (let x = 0; x < imageToDraw.width; x++) {
      for (let y = 0; y < imageToDraw.height; y++) {
        const color = imageToDraw.get(x, y);

        if (color) {
          context.fillStyle = rgbToHex(color.r, color.g, color.b);
          context.fillRect(x, y, 1, 1);
        }
      }
    }
  };

  return <BorderedCanvas ref={canvasRef} color={'#1e1f22'} />;
};
