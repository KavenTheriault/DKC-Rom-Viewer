import { useLocation } from 'react-router-dom';
import { SelectedRom } from '../../types/selected-rom';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { EntityViewer } from './entity';
import { SpriteViewer } from './sprite';
import { AnimationViewer } from './animation';
import { PaletteViewer } from './palette';

export interface ViewerState {
  selectedRom: SelectedRom;
}

enum ViewerMode {
  Entity = 'Entity',
  Sprite = 'Sprite',
  Animation = 'Animation',
  Palette = 'Palette',
}

const ViewerModeIcons: Record<ViewerMode, string> = {
  [ViewerMode.Entity]: 'fa-object-group',
  [ViewerMode.Sprite]: 'fa-image',
  [ViewerMode.Animation]: 'fa-panorama',
  [ViewerMode.Palette]: 'fa-palette',
};

export const Viewer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [viewerMode, setViewerMode] = useState<ViewerMode>(ViewerMode.Sprite);

  const viewerState = location.state
    ? (location.state as ViewerState)
    : undefined;
  if (!viewerState?.selectedRom) {
    navigate('/');
    return null;
  }

  const renderViewMode = () => {
    switch (viewerMode) {
      case ViewerMode.Entity:
        return <EntityViewer />;
      case ViewerMode.Sprite:
        return <SpriteViewer selectedRom={viewerState.selectedRom} />;
      case ViewerMode.Animation:
        return <AnimationViewer />;
      case ViewerMode.Palette:
        return <PaletteViewer />;
    }
  };

  return (
    <div className="container mt-6">
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
