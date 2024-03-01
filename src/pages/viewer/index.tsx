import { useLocation } from 'react-router-dom';
import { SelectedRom } from '../../types/selected-rom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { EntityViewer } from './entity';
import { SpriteViewer } from './sprite';
import { AnimationViewer } from './animation';
import { PaletteViewer } from './palette';
import { NavigateToMode, ViewerMode } from './types';

export interface ViewerState {
  selectedRom: SelectedRom;
}

const ViewerModeIcons: Record<ViewerMode, string> = {
  [ViewerMode.Entity]: 'fa-object-group',
  [ViewerMode.Animation]: 'fa-panorama',
  [ViewerMode.Sprite]: 'fa-image',
  [ViewerMode.Palette]: 'fa-palette',
};

export const Viewer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [viewerMode, setViewerMode] = useState<ViewerMode>(ViewerMode.Entity);

  const viewerState = location.state
    ? (location.state as ViewerState)
    : undefined;

  useEffect(() => {
    if (!viewerState?.selectedRom) {
      navigate('/');
    }
  }, []);

  const navigateToMode: NavigateToMode = (mode) => {
    setViewerMode(mode);
  };

  if (!viewerState?.selectedRom) return null;

  const renderViewMode = () => {
    switch (viewerMode) {
      case ViewerMode.Entity:
        return (
          <EntityViewer
            selectedRom={viewerState.selectedRom}
            navigateToMode={navigateToMode}
          />
        );
      case ViewerMode.Animation:
        return (
          <AnimationViewer
            selectedRom={viewerState.selectedRom}
            navigateToMode={navigateToMode}
          />
        );
      case ViewerMode.Sprite:
        return (
          <SpriteViewer
            selectedRom={viewerState.selectedRom}
            navigateToMode={navigateToMode}
          />
        );
      case ViewerMode.Palette:
        return (
          <PaletteViewer
            selectedRom={viewerState.selectedRom}
            navigateToMode={navigateToMode}
          />
        );
    }
  };

  return (
    <div className="container mt-6 mb-6 pl-4 pr-4">
      <nav className="breadcrumb" aria-label="breadcrumbs">
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li className="is-active">
            <a href="/viewer" aria-current="page">
              Viewer
            </a>
          </li>
        </ul>
      </nav>

      <div className="tabs is-centered">
        <ul>
          {Object.values(ViewerMode).map((mode) => (
            <li
              key={mode}
              className={viewerMode === mode ? 'is-active' : undefined}
            >
              <a onClick={() => setViewerMode(mode)}>
                <span className="icon is-small">
                  <i
                    className={`fas ${ViewerModeIcons[mode]}`}
                    aria-hidden="true"
                  ></i>
                </span>
                <span>{mode}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {renderViewMode()}
    </div>
  );
};
