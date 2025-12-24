import { RomHeader } from '../../../rom-io/rom/header';
import { CollapsibleBox } from '../../components/collapsible-box';
import { useAppSelector } from '../../state';
import { MainMenuItemComponent } from '../../types/layout';
import { useDrawAppName } from '../common/draw-app-name';

export const RomInfo: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();

  const rom = useAppSelector((s) => s.rom);
  if (!rom) return null;

  return children({
    top: {
      left: (
        <CollapsibleBox>
          <div className="block">
            <h4 className="subtitle is-4">Rom Header</h4>
            <table className="table">
              <tbody>
                {Object.keys(rom.header).map((k) => {
                  const value = rom.header[k as keyof RomHeader];
                  return (
                    <tr key={k}>
                      <th>{k}</th>
                      <td>
                        {typeof value === 'number'
                          ? value.toString(16).toUpperCase()
                          : value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CollapsibleBox>
      ),
    },
  });
};
