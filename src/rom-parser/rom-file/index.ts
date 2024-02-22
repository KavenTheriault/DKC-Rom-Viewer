const FILE_HEADER_LENGTH: number = 512;
/* The optional 512 bytes header of a Rom file
Ref: https://snes.nesdev.org/wiki/ROM_file_formats */
export const hasHeader = (bytes: Buffer): boolean => {
    // Rom file length without header should always be a division of 32768
    // If there are exactly 512 extra bytes, it means there's a file header
    return bytes.length % 0x8000 === FILE_HEADER_LENGTH;
};
/* Remove Rom file header if present */
export const getRomData = (bytes: Buffer): Buffer => {
    return hasHeader(bytes)
        ? bytes.subarray(FILE_HEADER_LENGTH, bytes.length)
        : bytes;
};
