import { SpriteHeader } from '../../../rom-parser/sprites/header';
import { SimpleTable } from '../../../components/simple-table';

interface SpriteHeaderTableProps {
  spriteHeader: SpriteHeader;
}

const toHexString = (val: number) =>
  '0x' + val.toString(16).toString().toUpperCase();

export const SpriteHeaderTable = ({ spriteHeader }: SpriteHeaderTableProps) => {
  return (
    <SimpleTable>
      <tbody>
        <tr key="header1">
          <th>
            <h4 className="title is-4 mt-3">Tiles</h4>
          </th>
        </tr>
        <tr key="tileQuantityLarge">
          <th>
            <h6 className="subtitle is-6">2x2</h6>
          </th>
          <td>{toHexString(spriteHeader.tileQuantity.large)}</td>
          <td>
            <strong>{spriteHeader.tileQuantity.large}</strong>
          </td>
        </tr>
        <tr key="tileQuantitySmall1">
          <th>
            <h6 className="subtitle is-6">1x1 (Group 1)</h6>
          </th>
          <td>{toHexString(spriteHeader.tileQuantity.small1)}</td>
          <td>
            <strong>{spriteHeader.tileQuantity.small1}</strong>
          </td>
        </tr>
        <tr key="tileQuantitySmall2">
          <th>
            <h6 className="subtitle is-6">1x1 (Group 2)</h6>
          </th>
          <td>{toHexString(spriteHeader.tileQuantity.small2)}</td>
          <td>
            <strong>{spriteHeader.tileQuantity.small2}</strong>
          </td>
        </tr>
        <tr key="header2">
          <th>
            <h4 className="title is-4 mt-3">Offsets</h4>
          </th>
        </tr>
        <tr key="small1Offset">
          <th>
            <h6 className="subtitle is-6">Group 1</h6>
          </th>
          <td>{toHexString(spriteHeader.offsets.small1Offset)}</td>
          <td>
            <strong>{spriteHeader.offsets.small1Offset}</strong>
          </td>
        </tr>
        <tr key="small2Offset">
          <th>
            <h6 className="subtitle is-6">Group 2</h6>
          </th>
          <td>{toHexString(spriteHeader.offsets.small2Offset)}</td>
          <td>
            <strong>{spriteHeader.offsets.small2Offset}</strong>
          </td>
        </tr>
        <tr key="header3">
          <th>
            <h4 className="title is-4 mt-3">DMA</h4>
          </th>
        </tr>
        <tr key="dmaGroup1TileQty">
          <th>
            <h6 className="subtitle is-6">Group 1</h6>
          </th>
          <td>{toHexString(spriteHeader.dma.group1TileQty)}</td>
          <td>
            <strong>{spriteHeader.dma.group1TileQty}</strong>
          </td>
        </tr>
        <tr key="dmaGroup2TileQty">
          <th>
            <h6 className="subtitle is-6">Group 2</h6>
          </th>
          <td>{toHexString(spriteHeader.dma.group2TileQty)}</td>
          <td>
            <strong>{spriteHeader.dma.group2TileQty}</strong>
          </td>
        </tr>
        <tr key="dmaGroup2Offset">
          <th>
            <h6 className="subtitle is-6">Group 2 Offset</h6>
          </th>
          <td>{toHexString(spriteHeader.dma.group2Offset)}</td>
          <td>
            <strong>{spriteHeader.dma.group2Offset}</strong>
          </td>
        </tr>
      </tbody>
    </SimpleTable>
  );
};
