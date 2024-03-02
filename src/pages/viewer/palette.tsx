import { ViewerMode, ViewerModeBaseProps } from './types';
import { useEffect, useState } from 'react';
import { Color } from '../../rom-parser/sprites/types';
import { rgbToHex, toHexString } from '../../utils/hex';
import { RomAddress } from '../../rom-parser/types/address';
import {
  PALETTE_STARTING_ADDRESS,
  paletteReferenceToSnesAddress,
  readPalette,
  snesAddressToPaletteReference,
} from '../../rom-parser/palette';
import { getViewerModeAddress, saveViewerModeAddress } from './memory';
import { ScanAddresses } from '../../components/scan-adresses';
import { scanPalettes } from '../../rom-parser/scan/palettes';
import { LoadHexadecimalInput } from '../../components/load-hexadecimal-input';

export const PaletteViewer = ({ selectedRom }: ViewerModeBaseProps) => {
  const [paletteAddress, setPaletteAddress] = useState<number>();
  const [paletteReference, setPaletteReference] = useState<number>();
  const [palette, setPalette] = useState<Color[]>();

  useEffect(() => {
    const initRomAddress = getViewerModeAddress(ViewerMode.Palette);
    if (initRomAddress) {
      setPaletteAddress(initRomAddress.snesAddress);
      onSnesAddressLoad(initRomAddress);
    }
  }, []);

  const onPaletteAddressLoadClick = () => {
    if (paletteAddress) {
      const romAddress = RomAddress.fromSnesAddress(paletteAddress);
      onSnesAddressLoad(romAddress);
    } else {
      setPaletteAddress(undefined);
      setPalette(undefined);
    }
  };

  const onPaletteReferenceLoadClick = () => {
    if (paletteReference) {
      const romAddress = paletteReferenceToSnesAddress(paletteReference);
      loadPalette(romAddress);
      setPaletteAddress(romAddress.snesAddress);
    } else {
      setPaletteAddress(undefined);
      setPalette(undefined);
    }
  };

  const onSnesAddressLoad = (romAddress: RomAddress) => {
    loadPalette(romAddress);
    setPaletteReference(snesAddressToPaletteReference(romAddress));
  };

  const loadPalette = (romAddress: RomAddress) => {
    const palette = readPalette(selectedRom.data, romAddress);
    setPalette(palette);
    saveViewerModeAddress(ViewerMode.Palette, romAddress);
  };

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="columns is-flex-wrap-wrap">
        <div className="column is-flex is-flex-direction-column is-align-items-start">
          <LoadHexadecimalInput
            label="SNES Address"
            hexadecimalValue={paletteAddress}
            onValueChange={setPaletteAddress}
            onValueLoad={onPaletteAddressLoadClick}
          />
          <LoadHexadecimalInput
            label={`Palette Reference (from ${toHexString(PALETTE_STARTING_ADDRESS, { addPrefix: true })})`}
            hexadecimalValue={paletteReference}
            onValueChange={setPaletteReference}
            onValueLoad={onPaletteReferenceLoadClick}
          />
        </div>
        <div className="column">
          {palette && (
            <table className="table is-hoverable">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>RBG Hex</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>0</th>
                  <td>-</td>
                  <td>
                    <span className="tag">Transparent</span>
                  </td>
                </tr>
                {palette.map((color, index) => (
                  <tr key={`color-${index}`}>
                    <th>{index + 1}</th>
                    <td>
                      <code>
                        {rgbToHex(color.r, color.g, color.b).toUpperCase()}
                      </code>
                    </td>
                    <td
                      style={{
                        backgroundColor: rgbToHex(color.r, color.g, color.b),
                        border: '1px solid black',
                      }}
                    ></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="column" />
      </div>
      <ScanAddresses
        scan={scanPalettes}
        selectedRom={selectedRom}
        onSelectedAddressChange={(paletteAddress) => {
          setPaletteAddress(paletteAddress.snesAddress);
          onSnesAddressLoad(paletteAddress);
        }}
        title="Palettes"
      />
    </div>
  );
};
