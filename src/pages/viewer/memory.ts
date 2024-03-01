import { ViewerMode } from './types';
import { RomAddress } from '../../rom-parser/types/address';

const _viewerModeAddress: Record<ViewerMode, RomAddress | undefined> = {
  [ViewerMode.Entity]: undefined,
  [ViewerMode.Animation]: undefined,
  [ViewerMode.Sprite]: undefined,
  [ViewerMode.Palette]: undefined,
};

export const getViewerModeAddress = (
  mode: ViewerMode,
): RomAddress | undefined => {
  return _viewerModeAddress[mode];
};

export const saveViewerModeAddress = (
  mode: ViewerMode,
  address: RomAddress,
): void => {
  _viewerModeAddress[mode] = address;
};
