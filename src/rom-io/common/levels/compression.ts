import { read16, read8 } from '../../buffer';
import { RomAddress } from '../../rom/address';

enum CompressionCommand {
  Common = 0xc0,
  Copy = 0x80,
  Write = 0x40,
  Raw = 0x00,
}

export const decompress = (romData: Buffer, address: RomAddress) => {
  let index = 0x80;
  const readNextByte = () => {
    const result = read8(romData, address.pcAddress + index);
    index++;
    return result;
  };

  let rawCommand = 1;
  const decompressed: number[] = [];
  while (rawCommand !== 0) {
    if (index > 0xffffff) throw new Error('Infinite!');

    rawCommand = readNextByte();

    // Command is 11000000
    // Parameter is 00111111
    const command = rawCommand & 0xc0;
    const parameter = rawCommand & 0x3f;

    if (command == CompressionCommand.Common) {
      const commonIndex = parameter * 2;
      decompressed.push(read8(romData, address.pcAddress + commonIndex));
      decompressed.push(read8(romData, address.pcAddress + commonIndex + 1));
    } else if (command == CompressionCommand.Copy) {
      const copyIndex = read16(romData, address.pcAddress + index);
      index += 2;

      for (let i = 0; i < parameter; i++) {
        decompressed.push(decompressed[copyIndex + i]);
      }
    } else if (command == CompressionCommand.Write) {
      const toRepeat = readNextByte();
      for (let i = 0; i < parameter; i++) {
        decompressed.push(toRepeat);
      }
    } else if (command == CompressionCommand.Raw) {
      for (let i = 0; i < parameter; i++) {
        decompressed.push(readNextByte());
      }
    } else {
      throw new Error('Invalid compression command');
    }
  }

  return decompressed;
};
