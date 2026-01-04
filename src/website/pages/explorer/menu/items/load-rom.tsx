import { Buffer as WebBuffer } from 'buffer';
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

export const LoadRom: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();

  const appStore = useAppStore();
  const rom = stateSelector((s) => s.rom);

  const [filePath, setFilePath] = useState('');

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

  const onSelectedRom = (selectedRom: Rom) => {
    appStore.set((s) => {
      s.rom = selectedRom;
      s.canvasController.zoom('in', s.canvasController.center, 2.5);

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

  const onClearSelectedRom = () => {
    appStore.set((s) => {
      s.rom = null;
      s.mainMenu.groups = menuGroups;
    });
  };

  return children({
    top: {
      left: (
        <CollapsiblePanel title="Load Rom">
          {rom ? (
            <>
              <div className="block">
                Selected Rom:{' '}
                <strong>
                  {rom.header.title}{' '}
                  <span className="tag is-light">{rom.header.version}</span>
                </strong>
              </div>
              <button
                className="button is-primary"
                onClick={onClearSelectedRom}
              >
                Select another Rom
              </button>
            </>
          ) : (
            <>
              <div className="block">
                Please select{' '}
                <strong>Donkey Kong Country (U) (V1.0) [!].smc</strong> from
                your device
              </div>
              <div className="block file has-name is-fullwidth">
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
                    <span className="file-label">Choose a Rom…</span>
                  </span>
                  <span className="file-name">
                    {filePath.replace(/.*[/\\]/, '')}
                  </span>
                </label>
              </div>
            </>
          )}
        </CollapsiblePanel>
      ),
    },
  });
};
