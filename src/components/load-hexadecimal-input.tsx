import { HexadecimalInput } from './hexadecimal-input';

interface LoadHexadecimalInputProps {
  label: string;
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
    <div className="block">
      <label className="label">{label}</label>
      <div className="field has-addons">
        <p className="control">
          <a className="button is-static">0x</a>
        </p>
        <p className="control">
          <HexadecimalInput
            className="input"
            placeholder="Hexadecimal"
            value={hexadecimalValue}
            onChange={onValueChange}
          />
        </p>
        <p className="control">
          <a className="button is-primary" onClick={onValueLoad}>
            Load
          </a>
        </p>
      </div>
    </div>
  );
};
