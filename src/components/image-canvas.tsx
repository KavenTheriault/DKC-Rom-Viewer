import { useEffect, useRef, useState } from 'react';
import { Image } from '../rom-parser/sprites/types';
import { rgbToHex } from '../utils/hex';
import styled from 'styled-components';

interface SpriteCanvasProps {
  image?: Image;
  defaultSize: { width: number; height: number };
}

const BorderedCanvas = styled.canvas<{ backgroundColor: string }>`
  border: 1px solid;
  border-radius: 8px;
  box-shadow: 5px 5px 5px darkgray;

  background-color: ${(props) => props.backgroundColor};
`;

export const ImageCanvas = ({ image, defaultSize }: SpriteCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(2);
  const [backgroundColor, setBackgroundColor] = useState<string>('#1e1f22');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = (image ? image.length : defaultSize.width) * zoom;
      canvas.height = (image ? image[0].length : defaultSize.height) * zoom;

      const context = canvas.getContext('2d');
      if (context) {
        drawImage(context);
      }
    }
  }, [zoom, image]);

  const drawImage = (context: CanvasRenderingContext2D) => {
    if (!image) return;
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
    <div className="is-flex is-flex-direction-column is-align-items-center">
      <BorderedCanvas ref={canvasRef} backgroundColor={backgroundColor} />
      <div className="columns mt-1">
        <div className="column is-flex is-align-items-center">
          <span className="mr-3">
            <strong>Zoom</strong>
          </span>
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
        <div className="column is-flex is-align-items-center">
          <span className="mr-3">
            <strong>Background</strong>
          </span>
          <div className="select is-info">
            <select
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
            >
              <option value="#ffffff">White</option>
              <option value="#1e1f22">Jetbrains</option>
              <option value="#252525">Photopea</option>
              <option value="#000000">Black</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
