import React from 'react';
import { CollapsiblePanel } from '../../../../components/collapsible-panel';
import { MainMenuItemComponent } from '../../../../types/layout';
import { useDrawAppName } from '../common/draw-app-name';

export const About: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();

  return children({
    top: {
      left: (
        <CollapsiblePanel title="About this project">
          <div>
            <strong>Donkey Kong Country - Explorer</strong> by{' '}
            <a href="https://github.com/KavenTheriault" target="_blank">
              Kaven Thériault
            </a>
          </div>
          <div className="mt-2">
            <a
              href="https://github.com/KavenTheriault/DKC-Rom-Viewer/"
              target="_blank"
            >
              GitHub Repository
            </a>
          </div>
        </CollapsiblePanel>
      ),
    },
  });
};
