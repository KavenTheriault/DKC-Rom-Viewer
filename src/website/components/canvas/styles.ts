import styled from 'styled-components';

export const CustomCanvas = styled.canvas<{ color: string }>`
  position: absolute;
  background-color: ${(props) => props.color};
`;
