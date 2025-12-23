import { MainMenuItemComponent } from '../../types/layout';
import React, { ChangeEvent, useState } from 'react';
import { CollapsibleBox } from '../../components/collapsible-box';
import { useDrawAppName } from '../common/draw-app-name';

export const LoadRom: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();
  const [filePath, setFilePath] = useState('');

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (event.target.value) {
      setFilePath(event.target.value);
    }

    if (event.target.files?.length) {
      const file: File = event.target.files[0];
      console.log(file);
      //await readRomFile(file);
    }
  };

  return children({
    top: {
      left: (
        <CollapsibleBox>
          <div className="block">
            Please select{' '}
            <strong>Donkey Kong Country (U) (V1.0) [!].smc</strong> from your
            device
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
        </CollapsibleBox>
      ),
    },
  });
};
