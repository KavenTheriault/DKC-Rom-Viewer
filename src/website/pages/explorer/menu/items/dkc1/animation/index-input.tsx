import { ReactNode } from 'react';

interface AnimationIndexInputProps {
  label: ReactNode;
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  onValueLoad: (value: number) => void;
}

export const AnimationIndexInput = ({
  label,
  onValueChange,
  onValueLoad,
  value,
}: AnimationIndexInputProps) => {
  return (
    <div>
      <label className="label is-small">{label}</label>
      <div className="field has-addons">
        <p className="control">
          <a className="button is-static is-small">0x</a>
        </p>
        <p className="control">
          <input
            className="input is-small"
            type="number"
            min={0}
            placeholder="Decimal"
            value={value}
            onChange={(e) =>
              onValueChange(
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
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
              onValueChange(newValue);
              onValueLoad(newValue);
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
