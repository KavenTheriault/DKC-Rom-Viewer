import { SpriteHeader } from '../../../../../rom-io/common/sprites/header';
import { toHexString } from '../../../../utils/hex';
import { InfoTable } from './styles';

interface SpriteHeaderTableProps {
  spriteHeader: SpriteHeader;
}

export const SpriteHeaderInfo = ({ spriteHeader }: SpriteHeaderTableProps) => {
  return (
    <InfoTable>
      <tbody>
        <tr key="header1">
          <th>Tiles</th>
        </tr>
        <tr key="tileQuantityLarge">
          <th>
            <span className="is-size-7 has-text-weight-normal">2x2</span>
          </th>
          <td>
            <strong>{spriteHeader.tileQuantity.large}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.tileQuantity.large, {
                addPrefix: true,
              })}
            </span>
          </td>
        </tr>
        <tr key="tileQuantitySmall1">
          <th>
            <span className="is-size-7 has-text-weight-normal">
              1x1 (Group 1)
            </span>
          </th>
          <td>
            <strong>{spriteHeader.tileQuantity.small1}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.tileQuantity.small1, {
                addPrefix: true,
              })}
            </span>
          </td>
        </tr>
        <tr key="tileQuantitySmall2">
          <th>
            <span className="is-size-7 has-text-weight-normal">
              1x1 (Group 2)
            </span>
          </th>
          <td>
            <strong>{spriteHeader.tileQuantity.small2}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.tileQuantity.small2, {
                addPrefix: true,
              })}
            </span>
          </td>
        </tr>
        <tr key="header2">
          <th>Offsets</th>
        </tr>
        <tr key="small1Offset">
          <th>
            <span className="is-size-7 has-text-weight-normal">Group 1</span>
          </th>
          <td>
            <strong>{spriteHeader.offsets.small1Offset}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.offsets.small1Offset, {
                addPrefix: true,
              })}
            </span>
          </td>
        </tr>
        <tr key="small2Offset">
          <th>
            <span className="is-size-7 has-text-weight-normal">Group 2</span>
          </th>
          <td>
            <strong>{spriteHeader.offsets.small2Offset}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.offsets.small2Offset, {
                addPrefix: true,
              })}
            </span>
          </td>
        </tr>
        <tr key="header3">
          <th>DMA</th>
        </tr>
        <tr key="dmaGroup1TileQty">
          <th>
            <span className="is-size-7 has-text-weight-normal">Group 1</span>
          </th>
          <td>
            <strong>{spriteHeader.dma.group1TileQty}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.dma.group1TileQty, { addPrefix: true })}
            </span>
          </td>
        </tr>
        <tr key="dmaGroup2TileQty">
          <th>
            <span className="is-size-7 has-text-weight-normal">Group 2</span>
          </th>
          <td>
            <strong>{spriteHeader.dma.group2TileQty}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.dma.group2TileQty, { addPrefix: true })}
            </span>
          </td>
        </tr>
        <tr key="dmaGroup2Offset">
          <th>
            <span className="is-size-7 has-text-weight-normal">
              Group 2 Offset
            </span>
          </th>
          <td>
            <strong>{spriteHeader.dma.group2Offset}</strong>
          </td>
          <td>
            <span className="tag is-light">
              {toHexString(spriteHeader.dma.group2Offset, { addPrefix: true })}
            </span>
          </td>
        </tr>
      </tbody>
    </InfoTable>
  );
};
