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
          <th className="is-size-7">Index</th>
          <th className="is-size-7">RBG Hex</th>
          <th className="is-size-7">Preview</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th className="is-size-7">0</th>
          <td className="is-size-7">-</td>
          <td className="is-size-7">Transparent</td>
        </tr>
        {palette.colors.map((color, index) => (
          <tr key={`color-${index}`}>
            <th className="is-size-7">{index + 1}</th>
            <td className="is-size-7">
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
