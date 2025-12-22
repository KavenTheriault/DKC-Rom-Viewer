import { CanvasController } from '../components/canvas/canvas-controller';
import React, { useEffect, useRef } from 'react';
import { CanvasWithControl } from '../components/canvas-with-controls';
import { Overlay } from '../components/overlay';
import { MainMenu } from '../components/main-menu';

export const Home = () => {
  const canvasController = useRef<CanvasController>(new CanvasController());

  useEffect(() => {
    canvasController.current.registerDrawHandler(draw);
    canvasController.current.draw();

    return () => {
      canvasController.current.unregisterDrawHandler(draw);
    };
  }, []);

  const draw = (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ) => {
    const text = 'Hello World';
    context.fillStyle = 'white';
    context.font = '48px Arial';

    const textSize = context.measureText(text);
    context.fillText(
      text,
      canvas.width / 2 - textSize.width / 2,
      canvas.height / 2,
    );
  };

  return (
    <Overlay
      slots={{
        top: {
          left: (
            <div style={{ pointerEvents: 'auto' }}>
              <MainMenu
                menuGroups={[
                  {
                    label: 'General',
                    items: [
                      { fasIcon: 'fa-object-group', label: 'Entity' },
                      { fasIcon: 'fa-panorama', label: 'Animation' },
                      { fasIcon: 'fa-image', label: 'Sprite' },
                      { fasIcon: 'fa-palette', label: 'Palette' },
                      { fasIcon: 'fa-scroll', label: 'Level' },
                    ],
                  },
                ]}
              />
            </div>
          ),
        },
      }}
    >
      <CanvasWithControl canvasController={canvasController.current} />
    </Overlay>
  );
};
