import { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface BitmapCanvasProps {
  image?: ImageBitmap;
}

const BorderedCanvas = styled.canvas<{ color: string }>`
  border: 1px solid;
  border-radius: 8px;
  box-shadow: 5px 5px 5px darkgray;
  background-color: ${(props) => props.color};
`;

export const BitmapCanvas = ({ image }: BitmapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = image ? image.width : 0;
      canvas.height = image ? image.height : 0;

      const context = canvas.getContext('2d');
      if (context) {
        if (image) context.drawImage(image, 0, 0);
      }
    }
  }, [image]);

  return <BorderedCanvas ref={canvasRef} color={'#1e1f22'} />;
};
