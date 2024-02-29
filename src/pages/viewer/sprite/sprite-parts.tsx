import { SpritePart } from '../../../rom-parser/sprites/types';
import { toHexString } from '../../../utils/hex';
import { ChangeEvent, useEffect, useState } from 'react';

interface SpritePartsViewerProps {
  spriteParts?: SpritePart[];
  onSelectedIndexesChange?: (selection: number[]) => void;
}

const spritePartString = (spritePart: SpritePart) => {
  const address =
    spritePart.type === '8x8'
      ? spritePart.tile.address
      : spritePart.tile.tiles[0].address;

  return `${toHexString(address.snesAddress, { addPrefix: true })} - (${spritePart.type})`;
};

const spritePartTiles = (spritePart: SpritePart) => {
  return spritePart.type === '8x8' ? [spritePart.tile] : spritePart.tile.tiles;
};

export const SpritePartsViewer = ({
  spriteParts,
  onSelectedIndexesChange,
}: SpritePartsViewerProps) => {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIndexes([0]);
  }, [spriteParts]);

  const onSelectionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.options);
    const selection = options
      .filter((o) => o.selected)
      .map((o) => parseInt(o.value));
    setSelectedIndexes(selection);

    if (onSelectedIndexesChange) onSelectedIndexesChange(selection);
  };

  const spritePartToShow =
    selectedIndexes.length === 1
      ? spriteParts?.at(selectedIndexes[0])
      : undefined;
  return (
    <>
      <div className="columns is-flex">
        <div className="column is-flex is-flex-direction-column">
          <label className="label">Sprite Parts</label>
          <div className="select is-multiple">
            <select
              multiple
              size={10}
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
        </div>
        {spritePartToShow && (
          <div className="column" style={{ minWidth: '125px' }}>
            <div className="field">
              <label className="label">X</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  value={spritePartToShow.coordinate.x}
                  readOnly
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Y</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  value={spritePartToShow.coordinate.y}
                  readOnly
                />
              </div>
            </div>
            {spritePartTiles(spritePartToShow).map((tile, index) => (
              <div className="field" key={`tile${index}`}>
                <label className="label">Tile {index + 1}</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    value={toHexString(tile.address.snesAddress, {
                      addPrefix: true,
                    })}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
