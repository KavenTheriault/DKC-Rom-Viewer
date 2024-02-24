import { SpritePart } from '../../../rom-parser/sprites/types';
import { toHexString } from '../../../utils/hex';
import { useEffect, useState } from 'react';

interface SpritePartsViewerProps {
  spriteParts?: SpritePart[];
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

export const SpritePartsViewer = ({ spriteParts }: SpritePartsViewerProps) => {
  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedPartIndex(0);
  }, [spriteParts]);

  const spritePart = spriteParts?.at(selectedPartIndex);
  return (
    <>
      <div className="columns">
        <div className="column">
          <label className="label">Sprite Parts</label>
          <div className="select is-multiple">
            <select
              multiple
              size={10}
              onChange={(e) =>
                spriteParts && setSelectedPartIndex(parseInt(e.target.value))
              }
              value={[selectedPartIndex.toString()]}
            >
              {spriteParts?.map((spritePart, index) => (
                <option value={index}>{spritePartString(spritePart)}</option>
              ))}
            </select>
          </div>
        </div>
        {spritePart && (
          <div className="column">
            <div className="field">
              <label className="label">X</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  value={spritePart.coordinate.x}
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
                  value={spritePart.coordinate.y}
                  readOnly
                />
              </div>
            </div>
            {spritePartTiles(spritePart).map((tile, index) => (
              <div className="field">
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
