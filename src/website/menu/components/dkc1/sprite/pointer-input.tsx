import { ReactNode } from 'react';
import { HexadecimalInput } from '../../../../components/hexadecimal-input';

interface SpritePointerInputProps {
  label: ReactNode;
  hexadecimalValue: number | undefined;
  onValueChange: (value: number | undefined) => void;
  onValueLoad: (value: number) => void;
}

export const SpritePointerInput = ({
  hexadecimalValue,
  label,
  onValueChange,
  onValueLoad,
}: SpritePointerInputProps) => {
  return (
    <div className="block">
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
          <a
            className="button is-primary is-small"
            onClick={() => {
              if (hexadecimalValue) onValueLoad(hexadecimalValue);
            }}
          >
            Load
          </a>
        </p>
        <p className="control">
          <a
            className="button is-primary is-small is-outlined"
            onClick={() => {
              const newValue = (hexadecimalValue ?? 0) - 4;
              onValueChange(newValue);
              onValueLoad(newValue);
            }}
          >
            -4
          </a>
        </p>
        <p className="control">
          <a
            className="button is-primary is-small is-outlined"
            onClick={() => {
              const newValue = (hexadecimalValue ?? 0) + 4;
              onValueChange(newValue);
              onValueLoad(newValue);
            }}
          >
            +4
          </a>
        </p>
      </div>
    </div>
  );
};
