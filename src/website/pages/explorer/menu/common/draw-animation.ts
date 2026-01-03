import { useEffect, useRef } from 'react';
import {
  Animation,
  AnimationStep,
} from '../../../../../rom-io/common/animations/types';
import { ImageMatrix } from '../../../../../rom-io/types/image-matrix';
import { stateSelector } from '../../../../state/selector';
import { drawImage, getDrawCenterOffset } from '../../../../utils/draw';

export const useDrawAnimation = (animation: Animation | undefined) => {
  const canvasController = stateSelector((s) => s.canvasController);
  const animationInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const buildDrawFnAndStartAnimation = () => {
    if (!animation) return;

    const frames: ImageMatrix[] = animation.reduce(
      (acc: ImageMatrix[], step: AnimationStep) => {
        for (let i = 0; i < step.time; i++) {
          acc.push(step.image);
        }
        return acc;
      },
      [],
    );

    let currentFrame = 0;
    const drawAnimationFrame = (
      canvas: HTMLCanvasElement,
      context: CanvasRenderingContext2D,
    ) => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const spriteImage = frames[currentFrame];
      if (!spriteImage) return;

      const centerOffset = getDrawCenterOffset(canvas, spriteImage.size);
      drawImage(context, spriteImage, centerOffset);
    };

    const drawNextFrame = () => {
      if (currentFrame >= frames.length - 1) currentFrame = 0;
      else currentFrame++;

      canvasController.draw();
    };

    // noinspection TypeScriptValidateTypes
    animationInterval.current = setInterval(drawNextFrame, 15);
    return drawAnimationFrame;
  };

  const stopAnimation = () => {
    if (animationInterval.current) {
      clearInterval(animationInterval.current);
      animationInterval.current = undefined;
    }
  };

  useEffect(() => {
    const drawFn = buildDrawFnAndStartAnimation();
    if (!drawFn) return;

    canvasController.registerDrawHandler(drawFn);
    canvasController.draw();

    return () => {
      stopAnimation();
      canvasController.unregisterDrawHandler(drawFn);
    };
  }, [animation]);
};
