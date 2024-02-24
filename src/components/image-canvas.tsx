import { useEffect, useRef, useState } from 'react';
import { Image } from '../rom-parser/sprites/types';
import { rgbToHex } from '../utils/hex';
import styled from 'styled-components';

interface SpriteCanvasProps {
  image: Image;
}

const BorderedCanvas = styled.canvas`
  border: 1px solid;
`;

export const ImageCanvas = ({ image }: SpriteCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = image.length * zoom;
      canvas.height = image[0].length * zoom;

      const context = canvas.getContext('2d');
      if (context) {
        drawImage(context);
      }
    }
  }, [zoom, image]);

  const drawImage = (context: CanvasRenderingContext2D) => {
    context.scale(zoom, zoom);

    for (let x = 0; x < image.length; x++) {
      for (let y = 0; y < image[0].length; y++) {
        const color = image[y][x];

        if (color) {
          context.fillStyle = rgbToHex(color.r, color.g, color.b);
          context.fillRect(x, y, 1, 1);
        }
      }
    }
  };

  return (
    <div>
      <BorderedCanvas ref={canvasRef} />
      <div className="block">
        <div className="select is-info">
          <select
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
          >
            <option value={1}>x1</option>
            <option value={2}>x2</option>
            <option value={3}>x3</option>
            <option value={4}>x4</option>
          </select>
        </div>
      </div>
    </div>
  );
};
