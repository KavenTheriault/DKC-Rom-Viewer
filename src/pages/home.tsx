import { Buffer } from 'buffer';
import { ChangeEvent, useState } from 'react';
import { getRomData } from '../rom-parser/rom-file';
import { getRomHeader, RomHeader } from '../rom-parser/rom-header';

export const Home = () => {
  const [filePath, setFilePath] = useState('');
  const [romHeader, setRomHeader] = useState<RomHeader>();
  const [error, setError] = useState('');

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (event.target.value) {
      setFilePath(event.target.value);
    }

    if (event.target.files?.length) {
      const file: File = event.target.files[0];
      await readRomFile(file);
    }
  };

  const readRomFile = async (file: File): Promise<void> => {
    try {
      const bytes: ArrayBuffer = await file.arrayBuffer();
      const buffer: Buffer = Buffer.from(bytes);

      const romData: Buffer = getRomData(buffer);
      const header: RomHeader = getRomHeader(romData);

      setRomHeader(header);
    } catch (e: unknown) {
      const errorMessage: string =
        e instanceof Error ? e.message : 'An error occurred';
      setError(errorMessage);
      setRomHeader(undefined);
    }
  };

  return (
    <div className="container mt-6">
      <h1 className="title">Donkey Kong Country - Viewer</h1>

      {error && (
        <div className="notification is-danger">
          <button className="delete" onClick={() => setError('')}></button>
          {error}
        </div>
      )}

      <div className="box">
        <div className="block">
          Please select <strong>Donkey Kong Country (U) (V1.0) [!].smc</strong>{' '}
          from your device
        </div>

        <div className="block file has-name is-fullwidth">
          <label className="file-label">
            <input
              className="file-input"
              type="file"
              accept=".smc,.swc"
              onChange={handleFileChange}
            />
            <span className="file-cta">
              <span className="file-icon">
                <i className="fas fa-upload"></i>
              </span>
              <span className="file-label">Choose a Rom…</span>
            </span>
            <span className="file-name">
              {filePath.replace(/.*[\/\\]/, '')}
            </span>
          </label>
        </div>

        {romHeader && (
          <div className="block">
            <h4 className="subtitle is-4">Rom Header</h4>
            <table className="table">
              <tbody>
                {Object.keys(romHeader).map((k) => {
                  const value = romHeader[k as keyof RomHeader];
                  return (
                    <tr>
                      <th>{k}</th>
                      <td>
                        {typeof value === 'number'
                          ? value.toString(16).toUpperCase()
                          : value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="block">
          <button className="button is-primary" disabled={!romHeader}>
            Use this Rom
          </button>
        </div>
      </div>
    </div>
  );
};
