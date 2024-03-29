import { useEffect, useRef, useState } from 'react';
import { rgbToHex } from '../utils/hex';
import { Animation, AnimationStep } from '../rom-parser/animations/types';
import styled from 'styled-components';
import { ImageMatrix } from '../types/image-matrix';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpriteCanvasProps {
  image?: ImageMatrix;
  animation?: Animation;
  rectangles?: Rectangle[];
  defaultSize: { width: number; height: number };
  defaultZoom?: number;
}

const BorderedCanvas = styled.canvas<{ color: string }>`
  border: 1px solid;
  border-radius: 8px;
  box-shadow: 5px 5px 5px darkgray;
  background-color: ${(props) => props.color};
`;

export const ImageCanvas = ({
  image,
  animation,
  rectangles,
  defaultSize,
  defaultZoom,
}: SpriteCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(defaultZoom || 2);
  const [backgroundColor, setBackgroundColor] = useState<string>('#1e1f22');
  const animationInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = (image ? image.width : defaultSize.width) * zoom;
      canvas.height = (image ? image.height : defaultSize.height) * zoom;

      const context = canvas.getContext('2d');
      if (context) {
        context.scale(zoom, zoom);
        if (animation) startAnimation(canvas, context, animation);
        if (image) drawImage(context, image);
        if (rectangles) drawRectangles(context, rectangles);
      }
    }

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = undefined;
      }
    };
  }, [zoom, animation, image, rectangles]);

  const startAnimation = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    animationToDraw: Animation,
  ) => {
    const frames: ImageMatrix[] = animationToDraw.reduce(
      (acc: ImageMatrix[], step: AnimationStep) => {
        for (let i = 0; i < step.time; i++) {
          acc.push(step.image);
        }
        return acc;
      },
      [],
    );
    if (!frames.length) return;

    let currentFrame = 0;
    const drawAnimation = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawImage(context, frames[currentFrame]);
      if (currentFrame >= frames.length - 1) currentFrame = 0;
      else currentFrame++;
    };

    animationInterval.current = setInterval(drawAnimation, 15);
  };

  const drawRectangles = (
    context: CanvasRenderingContext2D,
    rectanglesToDraw: Rectangle[],
  ) => {
    context.lineWidth = 1;
    context.strokeStyle = 'white';

    for (const rectangle of rectanglesToDraw) {
      context.beginPath();
      context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      context.stroke();
    }
  };

  const drawImage = (
    context: CanvasRenderingContext2D,
    imageToDraw: ImageMatrix,
  ) => {
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

  return (
    <div className="is-flex is-flex-direction-column is-align-items-center">
      <BorderedCanvas ref={canvasRef} color={backgroundColor} />
      <div className="columns mt-1 is-flex">
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
