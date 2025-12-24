import { ChangeEvent, InputHTMLAttributes } from 'react';
import { isHexadecimal, toHexString } from '../../utils/hex';

interface HexadecimalInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'type' | 'onChange'
> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export const HexadecimalInput = (props: HexadecimalInputProps) => {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase();
    if (input === '') {
      props.onChange(undefined);
    } else if (isHexadecimal(input)) {
      props.onChange(parseInt(input, 16));
    }
  };

  return (
    <input
      {...props}
      type="text"
      value={props.value ? toHexString(props.value) : ''}
      onChange={onChange}
    />
  );
};
