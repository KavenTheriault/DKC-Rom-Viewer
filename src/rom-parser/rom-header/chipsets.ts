const COPROCESSOR_PLACEHOLDER = '<coprocessor>';
const SNES_CHIPSETS: Record<number, string> = {
    0x00: 'ROM only',
    0x01: 'ROM + RAM',
    0x02: 'ROM + RAM + Battery',
    0x03: `ROM + ${COPROCESSOR_PLACEHOLDER}`,
    0x04: `ROM + ${COPROCESSOR_PLACEHOLDER} + RAM`,
    0x05: `ROM + ${COPROCESSOR_PLACEHOLDER} + RAM + Battery`,
    0x06: `ROM + ${COPROCESSOR_PLACEHOLDER} + Battery`,
};

const SNES_COPROCESSORS: Record<number, string> = {
    0x00: 'DSP',
    0x10: 'GSU (SuperFX)',
    0x20: 'OBC1',
    0x30: 'SA-1',
    0x40: 'S-DD1',
    0x50: 'S-RTC',
    0xe0: 'Other (Super Game Boy/Satellaview)',
    0xf0: 'Custom',
};

export const getChipset = (rawChipset: number) => {
    const chipsetPart = rawChipset & 0x0f;
    const coprocessorPart = rawChipset & 0xf0;

    const chipset = SNES_CHIPSETS[chipsetPart];
    if (!chipset) return undefined;

    if (chipset.includes(COPROCESSOR_PLACEHOLDER)) {
        const coprocessor = SNES_COPROCESSORS[coprocessorPart];
        if (!coprocessor) return undefined;
        return chipset.replace(COPROCESSOR_PLACEHOLDER, coprocessor);
    }

    return chipset;
};
