import { useLocation } from 'react-router-dom';
import { SelectedRom } from '../../types/selected-rom';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { EntityViewer } from './entity';
import { SpriteViewer } from './sprite';
import { AnimationViewer } from './animation';
import { PaletteViewer } from './palette';
import { LoadViewerMode, ViewerMode } from './types';
import { RomAddress } from '../../rom-parser/types/address';

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
  const modeAddresses = useRef<Record<ViewerMode, RomAddress | undefined>>({
    [ViewerMode.Entity]: undefined,
    [ViewerMode.Animation]: undefined,
    [ViewerMode.Sprite]: undefined,
    [ViewerMode.Palette]: undefined,
  });

  const viewerState = location.state
    ? (location.state as ViewerState)
    : undefined;
  if (!viewerState?.selectedRom) {
    navigate('/');
    return null;
  }

  const loadViewerMode: LoadViewerMode = (mode, address) => {
    modeAddresses.current[mode] = address;
    setViewerMode(mode);
  };

  const renderViewMode = () => {
    switch (viewerMode) {
      case ViewerMode.Entity:
        return (
          <EntityViewer
            selectedRom={viewerState.selectedRom}
            loadViewerMode={loadViewerMode}
            initRomAddress={modeAddresses.current[ViewerMode.Entity]}
          />
        );
      case ViewerMode.Animation:
        return (
          <AnimationViewer
            selectedRom={viewerState.selectedRom}
            loadViewerMode={loadViewerMode}
            initRomAddress={modeAddresses.current[ViewerMode.Animation]}
          />
        );
      case ViewerMode.Sprite:
        return (
          <SpriteViewer
            selectedRom={viewerState.selectedRom}
            loadViewerMode={loadViewerMode}
            initRomAddress={modeAddresses.current[ViewerMode.Sprite]}
          />
        );
      case ViewerMode.Palette:
        return <PaletteViewer />;
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
