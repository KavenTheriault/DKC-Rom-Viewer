import { SpritePart } from '../../../../../../../rom-io/common/sprites/types';
import { toHexString } from '../../../../../../utils/hex';
import { InfoTable } from './styles';

interface SpritePartInfoProps {
  spritePart: SpritePart;
}

export const SpritePartInfo = ({ spritePart }: SpritePartInfoProps) => {
  return (
    <InfoTable>
      <tbody>
        <tr>
          <th>
            <span className="is-size-7 has-text-weight-normal">X</span>
          </th>
          <td>
            <strong>{spritePart.coordinate.x}</strong>
          </td>
        </tr>
        <tr>
          <th>
            <span className="is-size-7 has-text-weight-normal">Y</span>
          </th>
          <td>
            <strong>{spritePart.coordinate.y}</strong>
          </td>
        </tr>
        {getTilesInSpritePart(spritePart).map((tile, index) => (
          <tr>
            <th>
              <span className="is-size-7 has-text-weight-normal">
                Tile {index + 1}
              </span>
            </th>
            <td>
              <span className="tag is-light">
                {toHexString(tile.address.snesAddress, {
                  addPrefix: true,
                })}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </InfoTable>
  );
};

const getTilesInSpritePart = (spritePart: SpritePart) => {
  return spritePart.type === '8x8' ? [spritePart.tile] : spritePart.tile.tiles;
};
