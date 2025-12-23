import { MainMenuItemComponent } from '../../types/layout';
import React from 'react';
import { CollapsibleBox } from '../../components/collapsible-box';
import { useDrawAppName } from '../common/draw-app-name';

export const About: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();

  return children({
    top: {
      left: (
        <CollapsibleBox>
          <p>
            <strong>Donkey Kong Country - Explorer</strong> by{' '}
            <a href="https://github.com/KavenTheriault" target="_blank">
              Kaven Thériault
            </a>
            <br />
            <br />
            <a
              href="https://github.com/KavenTheriault/DKC-Rom-Viewer/"
              target="_blank"
            >
              GitHub Repository
            </a>
          </p>
        </CollapsibleBox>
      ),
    },
  });
};
