import { ViewerMode } from './types';
import { RomAddress } from '../../rom-parser/types/address';
import { DEFAULT_PALETTE } from '../../utils/defaults';

const _viewerModeAddress: Record<ViewerMode, RomAddress | undefined> = {
  [ViewerMode.Entity]: undefined,
  [ViewerMode.Animation]: undefined,
  [ViewerMode.Sprite]: undefined,
  [ViewerMode.Palette]: RomAddress.fromSnesAddress(DEFAULT_PALETTE),
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
