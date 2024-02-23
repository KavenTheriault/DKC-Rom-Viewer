export class RomAddress {
    private readonly _snesAddress: number;

    private constructor(snesAddress: number) {
        this._snesAddress = snesAddress;
    }

    public static fromSnesAddress(snesAddress: number): RomAddress {
        return new RomAddress(snesAddress);
    }

    get snesAddress(): number {
        return this._snesAddress;
    }

    get pcAddress(): number {
        return (
            this._snesAddress &
            (this._snesAddress > 0x7fffff ? 0x3fffff : 0xffffff)
        );
    }

    public getOffsetAddress = (offset: number): RomAddress => {
        return RomAddress.fromSnesAddress(this._snesAddress + offset);
    };

    public toString(): string {
        return this._snesAddress.toString(16).toUpperCase();
    }
}
