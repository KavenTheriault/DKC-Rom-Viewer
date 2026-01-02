import { RomHeader } from '../../../../../../rom-io/rom/header';
import { CollapsiblePanel } from '../../../../../components/collapsible-panel';
import { useAppSelector } from '../../../../../state';
import { MainMenuItemComponent } from '../../../../../types/layout';
import { useDrawAppName } from '../../common/draw-app-name';
import { RomInfoTable } from './styles';

export const RomInfo: MainMenuItemComponent = ({ children }) => {
  useDrawAppName();

  const rom = useAppSelector((s) => s.rom);
  if (!rom) return null;

  return children({
    top: {
      left: (
        <CollapsiblePanel title="Rom Info">
          <div className="block">
            <RomInfoTable className="table">
              <tbody>
                {Object.keys(rom.header).map((k) => {
                  const value = rom.header[k as keyof RomHeader];
                  return (
                    <tr key={k}>
                      <th>{camelToReadable(k)}</th>
                      <td>
                        {typeof value === 'number'
                          ? value.toString(16).toUpperCase()
                          : value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </RomInfoTable>
          </div>
        </CollapsiblePanel>
      ),
    },
  });
};

const camelToReadable = (str: string): string => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
};
