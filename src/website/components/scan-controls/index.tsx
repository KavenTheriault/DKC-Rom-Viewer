import { ChangeEvent, useState } from 'react';
import { RomAddress } from '../../../rom-io/rom/address';
import { Rom } from '../../../rom-io/rom/types';

interface ScanControlsProps {
  onSelectedAddressChange: (address: RomAddress) => void;
  scanFn: (romData: Buffer) => RomAddress[];
  rom: Rom;
}

const scanAsync = (
  romData: Buffer,
  scan: (romData: Buffer) => RomAddress[],
): Promise<RomAddress[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = scan(romData);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }, 0);
  });
};

export const ScanControls = ({
  onSelectedAddressChange,
  scanFn,
  rom,
}: ScanControlsProps) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [foundAddresses, setFoundAddresses] = useState<RomAddress[]>();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const onStartScanClick = async () => {
    setIsScanning(true);
    const found = await scanAsync(rom.data, scanFn);
    setFoundAddresses(found);
    setIsScanning(false);
  };

  const onIndexInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value) || 0;
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

    onSelectedAddressChange(foundAddresses[newIndex]);
  };

  return (
    <>
      <div className="is-flex is-flex-direction-row is-justify-content-center">
        <button
          className={[
            'button',
            'is-info',
            'is-small',
            ...(isScanning ? ['is-loading'] : []),
          ].join(' ')}
          onClick={onStartScanClick}
          disabled={!!foundAddresses}
        >
          {foundAddresses ? `${foundAddresses.length} found` : 'Start Scan'}
        </button>
      </div>
      {foundAddresses && (
        <div className="mt-2 field has-addons">
          <p className="control">
            <a
              className="button is-info is-outlined is-small"
              onClick={() => navigateIndex(-100)}
            >
              -100
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined is-small"
              onClick={() => navigateIndex(-10)}
            >
              -10
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined is-small"
              onClick={() => navigateIndex(-1)}
            >
              -1
            </a>
          </p>
          <p className="control">
            <input
              style={{ width: '80px' }}
              className="input is-info is-small"
              type="number"
              value={currentIndex}
              onChange={onIndexInputChange}
            />
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined is-small"
              onClick={() => navigateIndex(1)}
            >
              +1
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined is-small"
              onClick={() => navigateIndex(10)}
            >
              +10
            </a>
          </p>
          <p className="control">
            <a
              className="button is-info is-outlined is-small"
              onClick={() => navigateIndex(100)}
            >
              +100
            </a>
          </p>
        </div>
      )}
    </>
  );
};
