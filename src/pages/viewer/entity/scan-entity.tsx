import { Buffer } from 'buffer';
import { ChangeEvent, useState } from 'react';
import { scanEntities } from '../../../rom-parser/scan/entities';
import { RomAddress } from '../../../rom-parser/types/address';
import { SelectedRom } from '../../../types/selected-rom';
import { Entity } from '../../../rom-parser/entities/types';

interface ScanSpritesProps {
  selectedRom: SelectedRom;
  onEntityAddressToShow: (spriteAddress: RomAddress) => void;
}

const scanSpitesAsync = (
  romData: Buffer,
): Promise<ReturnType<typeof scanEntities>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = scanEntities(romData);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }, 0);
  });
};

export const ScanEntities = ({
  selectedRom,
  onEntityAddressToShow,
}: ScanSpritesProps) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [foundEntities, setFoundEntities] = useState<Entity[]>();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const onStartScanClick = async () => {
    setIsScanning(true);
    const found = await scanSpitesAsync(selectedRom.data);
    setFoundEntities(found);
    setIsScanning(false);
  };

  const onIndexInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value);
    updateIndex(newIndex);
  };

  const navigateIndex = (change: number) => {
    if (!foundEntities) return;

    const newIndex = currentIndex + change;
    updateIndex(newIndex);
  };

  const updateIndex = (requestedIndex: number) => {
    if (!foundEntities) return;

    let newIndex = requestedIndex;
    if (requestedIndex < 0) newIndex = 0;
    if (requestedIndex > foundEntities.length - 1)
      newIndex = foundEntities.length - 1;
    setCurrentIndex(newIndex);

    onEntityAddressToShow(foundEntities[newIndex].address);
  };

  return (
    <div>
      <h3 className="title is-3">Scan Entities</h3>
      <div className="block is-flex is-align-items-center">
        <button
          className={[
            'button',
            'is-info',
            ...(isScanning ? ['is-loading'] : []),
          ].join(' ')}
          onClick={onStartScanClick}
          disabled={!!foundEntities}
        >
          Start Scan
        </button>
        {foundEntities && (
          <span className="ml-2">
            Found <strong>{foundEntities.length}</strong> entities
          </span>
        )}
      </div>
      {foundEntities && (
        <div className="block">
          <label className="label">Load entity at:</label>
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
      )}
    </div>
  );
};
