import { ViewerModeBaseProps } from './types';
import { ChangeEvent, useEffect, useState } from 'react';
import { Color } from '../../rom-parser/sprites/types';
import { isHexadecimal, rgbToHex, toHexString } from '../../utils/hex';
import { RomAddress } from '../../rom-parser/types/address';
import { readPalette } from '../../rom-parser/palette';

export const PaletteViewer = ({
  selectedRom,
  initRomAddress,
}: ViewerModeBaseProps) => {
  const [paletteAddress, setPaletteAddress] = useState<string>('');
  const [palette, setPalette] = useState<Color[]>();

  useEffect(() => {
    if (initRomAddress) {
      setPaletteAddress(toHexString(initRomAddress.snesAddress));
      loadPalette(initRomAddress);
    }
  }, [initRomAddress]);

  const onPlatteAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setPaletteAddress(input);
    }
  };

  const onPaletteAddressLoadClick = () => {
    if (paletteAddress) {
      const parsedSnesAddress = parseInt(paletteAddress, 16);
      loadPalette(RomAddress.fromSnesAddress(parsedSnesAddress));
    } else {
      setPalette(undefined);
    }
  };

  const loadPalette = (romAddress: RomAddress) => {
    const palette = readPalette(selectedRom.data, romAddress);
    setPalette(palette);
  };

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="columns is-flex-wrap-wrap">
        <div className="column is-flex is-flex-direction-column is-align-items-start">
          <div className="block">
            <label className="label">SNES Address</label>
            <div className="field has-addons">
              <p className="control">
                <a className="button is-static">0x</a>
              </p>
              <p className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Hexadecimal"
                  value={paletteAddress}
                  onChange={onPlatteAddressChange}
                />
              </p>
              <p className="control">
                <a
                  className="button is-primary"
                  onClick={onPaletteAddressLoadClick}
                >
                  Load
                </a>
              </p>
            </div>
          </div>
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
                  <tr>
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
    </div>
  );
};
