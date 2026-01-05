import { ReactNode } from 'react';
import { HexadecimalInput } from './index';

interface LoadHexadecimalInputProps {
  label: ReactNode;
  hexadecimalValue: number | undefined;
  onValueChange: (value: number | undefined) => void;
  onValueLoad: () => void;
}

export const LoadHexadecimalInput = ({
  label,
  hexadecimalValue,
  onValueChange,
  onValueLoad,
}: LoadHexadecimalInputProps) => {
  return (
    <div>
      <label className="label is-small">{label}</label>
      <div className="field has-addons">
        <p className="control">
          <a className="button is-static is-small">0x</a>
        </p>
        <p className="control">
          <HexadecimalInput
            className="input is-small"
            placeholder="Hexadecimal"
            value={hexadecimalValue}
            onChange={onValueChange}
          />
        </p>
        <p className="control">
          <a className="button is-primary is-small" onClick={onValueLoad}>
            Load
          </a>
        </p>
      </div>
    </div>
  );
};
