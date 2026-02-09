import React from 'react';
import { HexadecimalInput } from '../../../../../../components/hexadecimal-input';

interface ReadOnlyHexInputProps {
  label: string;
  value: number;
}

export const ReadOnlyHexInput = ({ label, value }: ReadOnlyHexInputProps) => {
  return (
    <div>
      <label className="label is-small">{label}</label>
      <div className="field has-addons">
        <p className="control">
          <a className="button is-static is-small">0x</a>
        </p>
        <p className="control">
          <HexadecimalInput
            readOnly={true}
            className="input is-small"
            value={value}
          />
        </p>
      </div>
    </div>
  );
};
