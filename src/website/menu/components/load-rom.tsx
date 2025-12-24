import { Buffer as WebBuffer } from 'buffer';
import React, { ChangeEvent, useState } from 'react';
import { readRomFile } from '../../../rom-io/rom';
import { CollapsibleBox } from '../../components/collapsible-box';
import { setState, useAppSelector } from '../../state';
import { MainMenuItemComponent } from '../../types/layout';
import { useDrawAppName } from '../common/draw-app-name';

export const LoadRom: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();
  const rom = useAppSelector((s) => s.rom);

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
      setState(() => ({ rom }));
    }
  };

  return children({
    top: {
      left: (
        <CollapsibleBox>
          {rom ? (
            <>
              <div className="block">
                Selected Rom:{' '}
                <strong>
                  {rom.header.title}{' '}
                  <span className="tag is-info">{rom.header.version}</span>
                </strong>
              </div>
              <button
                className="button is-primary"
                onClick={() => {
                  setState(() => ({ rom: null }));
                }}
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
        </CollapsibleBox>
      ),
    },
  });
};
