import { ReactNode } from 'react';
import {
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
        <div>{slots?.top?.left}</div>
        <div>{slots?.top?.middle}</div>
        <div>{slots?.top?.right}</div>
      </OverlayRowContainer>
      <OverlayRowContainer>
        <div>{slots?.center?.left}</div>
        <div>{slots?.center?.middle}</div>
        <div>{slots?.center?.right}</div>
      </OverlayRowContainer>
      <OverlayRowContainer>
        <div>{slots?.bottom?.left}</div>
        <div>{slots?.bottom?.middle}</div>
        <div>{slots?.bottom?.right}</div>
      </OverlayRowContainer>
    </OverlayContainer>
  </>
);
