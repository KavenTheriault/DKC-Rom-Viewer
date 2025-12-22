import { ReactNode } from 'react';
import {
  OverlayCellContainer,
  OverlayChildrenContainer,
  OverlayContainer,
  OverlayRowContainer,
} from './styles';

export type OverlayProps = {
  children: ReactNode;
  slots?: {
    top?: {
      left?: ReactNode;
      middle?: ReactNode;
      right?: ReactNode;
    };
    center?: {
      left?: ReactNode;
      middle?: ReactNode;
      right?: ReactNode;
    };
    bottom?: {
      left?: ReactNode;
      middle?: ReactNode;
      right?: ReactNode;
    };
  };
};

export const Overlay = ({ children, slots }: OverlayProps) => (
  <>
    <OverlayChildrenContainer>{children}</OverlayChildrenContainer>
    <OverlayContainer>
      <OverlayRowContainer>
        <OverlayCellContainer>{slots?.top?.left}</OverlayCellContainer>
        <OverlayCellContainer>{slots?.top?.middle}</OverlayCellContainer>
        <OverlayCellContainer>{slots?.top?.right}</OverlayCellContainer>
      </OverlayRowContainer>
      <OverlayRowContainer>
        <OverlayCellContainer>{slots?.center?.left}</OverlayCellContainer>
        <OverlayCellContainer>{slots?.center?.middle}</OverlayCellContainer>
        <OverlayCellContainer>{slots?.center?.right}</OverlayCellContainer>
      </OverlayRowContainer>
      <OverlayRowContainer>
        <OverlayCellContainer>{slots?.bottom?.left}</OverlayCellContainer>
        <OverlayCellContainer>{slots?.bottom?.middle}</OverlayCellContainer>
        <OverlayCellContainer>{slots?.bottom?.right}</OverlayCellContainer>
      </OverlayRowContainer>
    </OverlayContainer>
  </>
);
