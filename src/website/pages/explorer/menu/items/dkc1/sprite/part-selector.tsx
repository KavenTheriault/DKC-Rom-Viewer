import React, { ChangeEvent, useEffect, useState } from 'react';
import { SpritePart } from '../../../../../../../rom-io/common/sprites/types';
import { toHexString } from '../../../../../../utils/hex';

interface SpritePartSelectorProps {
  spriteParts: SpritePart[];
  onSelectedPartsChange: (parts: SpritePart[]) => void;
}

const spritePartString = (spritePart: SpritePart) => {
  const address =
    spritePart.type === '8x8'
      ? spritePart.tile.address
      : spritePart.tile.tiles[0].address;

  return `${toHexString(address.snesAddress, { addPrefix: true })} - (${spritePart.type})`;
};

export const SpritePartSelector = ({
  spriteParts,
  onSelectedPartsChange,
}: SpritePartSelectorProps) => {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const onSelectionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options);
    const selection = options
      .filter((o) => o.selected)
      .map((o) => parseInt(o.value));
    setSelectedIndexes(selection);
  };

  useEffect(() => {
    const selectedParts = selectedIndexes.map((s) => spriteParts.at(s)!);
    onSelectedPartsChange(selectedParts);
  }, [selectedIndexes]);

  return (
    <div className="is-flex is-flex-direction-column">
      <div className="select is-multiple">
        <select
          multiple
          size={8}
          onChange={onSelectionChange}
          value={selectedIndexes.map((p) => p.toString())}
        >
          {spriteParts?.map((spritePart, index) => (
            <option key={`spritePart${index}`} value={index}>
              {spritePartString(spritePart)}
            </option>
          ))}
        </select>
      </div>
      <div className="is-flex is-flex-direction-row is-justify-content-space-between m-1">
        <button
          className="button is-light"
          onClick={() => setSelectedIndexes(spriteParts.map((_, i) => i))}
        >
          <i className="fas fa-border-all"></i>
          <span className="ml-1">All</span>
        </button>
        <button
          className="button is-light"
          onClick={() => setSelectedIndexes([])}
        >
          <i className="fas fa-border-none"></i>
          <span className="ml-1">None</span>
        </button>
      </div>
    </div>
  );
};
