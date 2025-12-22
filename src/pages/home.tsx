import { CanvasController } from '../components/canvas/canvas-controller';
import React, { useEffect, useRef } from 'react';
import { CanvasWithControl } from '../components/canvas-with-controls';
import { Overlay } from '../components/overlay';
import { MainMenu } from '../components/main-menu';
import { CollapsibleBox } from '../components/collapsible-box';
import styled from 'styled-components';

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
            <HomeContainer>
              <MainMenu />
              <CollapsibleBox>
                <label className="label">Address</label>
                <input type="text" className="input" />
                <label className="label">Index</label>
                <input type="text" className="input" />
              </CollapsibleBox>
            </HomeContainer>
          ),
        },
      }}
    >
      <CanvasWithControl canvasController={canvasController.current} />
    </Overlay>
  );
};

export const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
  gap: 16px;
`;
