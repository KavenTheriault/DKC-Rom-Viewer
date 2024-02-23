import { ChangeEvent, useState } from 'react';
import { SelectedRom } from '../../types/selected-rom';
import { getSpriteHeader, SpriteHeader } from '../../rom-parser/sprites/header';
import { RomAddress } from '../../rom-parser/types/address';
import { SpriteHeaderTable } from './components/sprite-header';
import { validateSpriteHeader } from '../../rom-parser/scan/sprites';

interface SpriteViewerProps {
  selectedRom: SelectedRom;
}

const isHexadecimal = (str: string) => /^[0-9A-F]+$/.test(str);

export const SpriteViewer = ({ selectedRom }: SpriteViewerProps) => {
  const [snesAddress, setSnesAddress] = useState<string>('');
  const [spriteIndex, setSpriteIndex] = useState<string>('');
  const [spriteHeader, setSpriteHeader] = useState<SpriteHeader>();
  const [error, setError] = useState('');

  const onSnesAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setSnesAddress(input);
    }
  };

  const onSpriteIndexChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '' || isHexadecimal(input)) {
      setSpriteIndex(input);
    }
  };

  const onSnesAddressLoadClick = () => {
    if (snesAddress) {
      const parsedSnesAddress = parseInt(snesAddress, 16);
      const header = getSpriteHeader(
        selectedRom.data,
        RomAddress.fromSnesAddress(parsedSnesAddress),
      );
      setSpriteHeader(header);

      if (header && !validateSpriteHeader(header)) {
        setError('Invalid Sprite Header');
      } else {
        setError('');
      }
    } else {
      setSpriteHeader(undefined);
    }
  };

  return (
    <div>
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
              value={snesAddress}
              onChange={onSnesAddressChange}
            />
          </p>
          <p className="control">
            <a className="button is-primary" onClick={onSnesAddressLoadClick}>
              Load
            </a>
          </p>
        </div>
      </div>
      <div className="block">
        <label className="label">Sprite Index (from 0x3BCC9C)</label>
        <div className="field has-addons">
          <p className="control">
            <a className="button is-static">0x</a>
          </p>
          <p className="control">
            <input
              className="input"
              type="text"
              placeholder="Hexadecimal"
              value={spriteIndex}
              onChange={onSpriteIndexChange}
            />
          </p>
          <p className="control">
            <a className="button is-primary">Load</a>
          </p>
        </div>
      </div>

      {error && (
        <div className="notification is-warning">
          <button className="delete" onClick={() => setError('')}></button>
          {error}
        </div>
      )}

      {spriteHeader && (
        <nav className="panel is-info">
          <p className="panel-heading">Sprite Header</p>
          <div className="panel-block">
            <SpriteHeaderTable spriteHeader={spriteHeader} />
          </div>
        </nav>
      )}
    </div>
  );
};
