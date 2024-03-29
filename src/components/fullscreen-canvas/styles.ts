import styled from 'styled-components';

export const CustomCanvas = styled.canvas<{ color: string }>`
  z-index: 0;
  position: absolute;

  background-color: ${(props) => props.color};
`;

export const OverlayContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 12px;
  pointer-events: none;
  height: 100vh;
  width: 100vw;
  z-index: 1;
`;

export const OverlayRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
