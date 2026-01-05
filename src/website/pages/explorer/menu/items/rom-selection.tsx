import { Buffer as WebBuffer } from 'buffer';
import { cloneDeep } from 'lodash';
import React, { ChangeEvent, useState } from 'react';
import { readRomFile } from '../../../../../rom-io/rom';
import { Rom } from '../../../../../rom-io/rom/types';
import { CollapsiblePanel } from '../../../../components/collapsible-panel';
import { stateSelector, useAppStore } from '../../../../state/selector';
import { MainMenuItemComponent } from '../../../../types/layout';
import { useDrawAppName } from '../common/draw-app-name';
import {
  dkc1MenuGroup,
  entityMenuItem,
  menuGroups,
  romInfoMenuItem,
} from '../index';

const DKC1_ROM_BASE64_URL =
  'aHR0cHM6Ly9uZXNuaW5qYS5jb20vZG93bmxvYWRzc25lcy9Eb25rZXklMjBLb25nJTIwQ291bnRyeSUyMCUyOFUlMjklMjAlMjhWMS4wJTI5JTIwJTVCJTIxJTVELnNtYw==';

export const RomSelection: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();

  const appStore = useAppStore();
  const rom = stateSelector((s) => s.rom);

  const [filePath, setFilePath] = useState('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState('');

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (event.target.value) {
      setFilePath(event.target.value);
    }

    if (event.target.files?.length) {
      const file: File = event.target.files[0];

      const bytes: ArrayBuffer = await file.arrayBuffer();
      const buffer: Buffer = WebBuffer.from(bytes);

      const rom = await readRomFile(buffer);
      onSelectedRom(rom);
    }
  };

  const loadRomFromWeb = async () => {
    setError('');

    try {
      setIsDownloading(true);
      const response = await fetch(atob(DKC1_ROM_BASE64_URL));

      const bytes: ArrayBuffer = await response.arrayBuffer();
      const buffer: Buffer = WebBuffer.from(bytes);

      const rom = await readRomFile(buffer);
      onSelectedRom(rom);
    } catch (e) {
      setError('An error occurred when downloading Rom');
    } finally {
      setIsDownloading(false);
    }
  };

  const onClearSelectedRom = () => {
    setFilePath('');

    appStore.set((s) => {
      s.rom = null;
      s.mainMenu.groups = cloneDeep(menuGroups);
    });
  };

  const onSelectedRom = (selectedRom: Rom) => {
    appStore.set((s) => {
      s.rom = selectedRom;

      const otherGroup = s.mainMenu.groups.find((g) => g.label == 'Other');
      if (otherGroup) otherGroup.items.splice(0, 0, romInfoMenuItem);
    });

    const isDkc1 =
      selectedRom.header.title.toUpperCase().trim() === 'DONKEY KONG COUNTRY';
    if (isDkc1) {
      appStore.set((s) => {
        s.mainMenu.groups.splice(1, 0, dkc1MenuGroup);
        s.mainMenu.selectedItem = entityMenuItem;
      });
    }
  };

  return children({
    top: {
      left: (
        <CollapsiblePanel title="Rom Selection">
          <div className="is-flex is-flex-direction-column is-align-items-center">
            {rom ? (
              <>
                <div className="mb-3">
                  <div className="has-text-weight-bold mb-1">Selected Rom</div>
                  <div>
                    <code>
                      {`${rom.header.title} ${rom.header.region} ${rom.header.version}`}
                    </code>
                  </div>
                </div>
                <button
                  className="button is-danger"
                  onClick={onClearSelectedRom}
                >
                  Clear selected Rom
                </button>
              </>
            ) : (
              <>
                <div className="mb-2">
                  Please select{' '}
                  <code>Donkey Kong Country (U) (V1.0) [!].smc</code>
                </div>
                <div className="file has-name is-fullwidth is-align-self-stretch">
                  <label className="file-label">
                    <input
                      className="file-input"
                      type="file"
                      accept=".smc,.swc"
                      onChange={handleFileChange}
                    />
                    <span className="file-cta">
                      <span className="file-icon">
                        <i className="fas fa-upload"></i>
                      </span>
                      <span className="file-label">From your device</span>
                    </span>
                    <span className="file-name">
                      {filePath.replace(/.*[/\\]/, '')}
                    </span>
                  </label>
                </div>
                <div className="m-2">Or</div>
                <button
                  className={`button is-primary is-align-self-stretch ${isDownloading ? 'is-loading' : ''}`}
                  onClick={loadRomFromWeb}
                >
                  Download{' '}
                  <strong className="ml-2">
                    Donkey Kong Country (U) (V1.0) [!].smc
                  </strong>
                </button>
              </>
            )}
          </div>
        </CollapsiblePanel>
      ),
      middle: (
        <>{error && <div className="notification is-danger">{error}</div>}</>
      ),
    },
  });
};
