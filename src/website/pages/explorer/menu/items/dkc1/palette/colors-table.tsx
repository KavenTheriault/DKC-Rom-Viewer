import { Palette } from '../../../../../../../rom-io/common/palettes/types';
import { rgbToHex } from '../../../../../../utils/hex';

interface PaletteColorsTableProps {
  palette: Palette;
}

export const PaletteColorsTable = ({ palette }: PaletteColorsTableProps) => {
  return (
    <table className="table is-hoverable">
      <thead>
        <tr>
          <th>Index</th>
          <th>RBG Hex</th>
          <th>Preview</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>0</th>
          <td>-</td>
          <td>
            <span className="tag">Transparent</span>
          </td>
        </tr>
        {palette.colors.map((color, index) => (
          <tr key={`color-${index}`}>
            <th>{index + 1}</th>
            <td>
              <code>{rgbToHex(color.r, color.g, color.b).toUpperCase()}</code>
            </td>
            <td
              style={{
                backgroundColor: rgbToHex(color.r, color.g, color.b),
                border: '1px solid black',
              }}
            ></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
