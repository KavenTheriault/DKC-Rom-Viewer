import { Buffer } from 'buffer';
import { ChangeEvent, useState } from 'react';
import { scanSprites } from '../../../rom-parser/scan/sprites';
import { RomAddress } from '../../../rom-parser/types/address';
import { SelectedRom } from '../../../types/selected-rom';

interface ScanSpritesProps {
  selectedRom: SelectedRom;
  onSpriteAddressToShow: (spriteAddress: RomAddress) => void;
}

const scanSpitesAsync = (
  romData: Buffer,
): Promise<ReturnType<typeof scanSprites>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = scanSprites(romData);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }, 0);
  });
};

export const ScanSprites = ({
  selectedRom,
  onSpriteAddressToShow,
}: ScanSpritesProps) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [foundAddresses, setFoundAddresses] = useState<RomAddress[]>();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const onStartScanClick = async () => {
    setIsScanning(true);
    const found = await scanSpitesAsync(selectedRom.data);
    setFoundAddresses(found);
    setIsScanning(false);
  };

  const onIndexInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    updateIndex(newIndex);
  };

  const navigateIndex = (change: number) => {
    if (!foundAddresses) return;

    const newIndex = currentIndex + change;
    updateIndex(newIndex);
  };

  const updateIndex = (requestedIndex: number) => {
    if (!foundAddresses) return;

    let newIndex = requestedIndex;
    if (requestedIndex < 0) newIndex = 0;
    if (requestedIndex > foundAddresses.length - 1)
      newIndex = foundAddresses.length - 1;
    setCurrentIndex(newIndex);

    onSpriteAddressToShow(foundAddresses[newIndex]);
  };

  return (
    <div>
      <h3 className="title is-3">Scan Sprites</h3>
      <div className="block is-flex is-align-items-center">
        <button
          className={[
            'button',
            'is-info',
            ...(isScanning ? ['is-loading'] : []),
          ].join(' ')}
          onClick={onStartScanClick}
          disabled={!!foundAddresses}
        >
          Start Scan
        </button>
        {foundAddresses && (
          <span className="ml-2">
            Found <strong>{foundAddresses.length}</strong> sprites
          </span>
        )}
      </div>
      <div className="block">
        <label className="label">Load sprite at:</label>
        <div className="field has-addons">
          <p className="control">
            <a
              className="button is-info is-outlined"
              onClick={() => navigateIndex(-100)}
            >
              -100
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined"
              onClick={() => navigateIndex(-10)}
            >
              -10
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined"
              onClick={() => navigateIndex(-1)}
            >
              -1
            </a>
          </p>
          <p className="control">
            <input
              style={{ width: '80px' }}
              className="input is-info"
              type="number"
              placeholder="Hexadecimal"
              value={currentIndex}
              onChange={onIndexInputChange}
            />
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined"
              onClick={() => navigateIndex(1)}
            >
              +1
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined"
              onClick={() => navigateIndex(10)}
            >
              +10
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined"
              onClick={() => navigateIndex(100)}
            >
              +100
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
