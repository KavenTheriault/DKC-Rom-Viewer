import styled from 'styled-components';

export const CustomCanvas = styled.canvas<{ color: string }>`
  z-index: 0;
  position: absolute;

  background-color: ${(props) => props.color};
`;
