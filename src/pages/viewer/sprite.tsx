import { SelectedRom } from '../../types/selected-rom';

interface SpriteViewerProps {
  selectedRom: SelectedRom;
}

export const SpriteViewer = ({ selectedRom }: SpriteViewerProps) => {
  return (
    <div>
      Sprite
      <div className="block">{JSON.stringify(selectedRom?.header)}</div>
    </div>
  );
};
