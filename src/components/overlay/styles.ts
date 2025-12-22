import styled from 'styled-components';

export const OverlayChildrenContainer = styled.div`
  position: absolute;
`;

export const OverlayContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 16px;
  pointer-events: none;
  height: 100vh;
  width: 100vw;

  position: relative;
  z-index: 1;
`;

export const OverlayRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
