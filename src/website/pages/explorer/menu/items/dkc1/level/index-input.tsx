import { ReactNode } from 'react';
import { HexadecimalInput } from '../../../../../../components/hexadecimal-input';

interface EntranceIndexInputProps {
  label: ReactNode;
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  onValueLoad: (value: number) => void;
}

export const EntranceIndexInput = ({
  label,
  onValueChange,
  onValueLoad,
  value,
}: EntranceIndexInputProps) => {
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
            value={value}
            onChange={(e) => onValueChange(e)}
          />
        </p>
        <p className="control">
          <a
            className="button is-primary is-small"
            onClick={() => {
              if (value) onValueLoad(value);
            }}
          >
            Load
          </a>
        </p>
        <p className="control">
          <a
            className="button is-primary is-small is-outlined"
            onClick={() => {
              const newValue = (value ?? 0) - 1;
              if (newValue > 0) {
                onValueChange(newValue);
                onValueLoad(newValue);
              }
            }}
          >
            -1
          </a>
        </p>
        <p className="control">
          <a
            className="button is-primary is-small is-outlined"
            onClick={() => {
              const newValue = (value ?? 0) + 1;
              onValueChange(newValue);
              onValueLoad(newValue);
            }}
          >
            +1
          </a>
        </p>
      </div>
    </div>
  );
};
