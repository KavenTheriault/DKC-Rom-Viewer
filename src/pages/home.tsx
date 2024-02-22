import { ChangeEvent, useState } from 'react';

export const Home = () => {
  const [filePath, setFilePath] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilePath(event.target.value);
  };

  return (
    <div className="container mt-6">
      <h1 className="title">Donkey Kong Country - Viewer</h1>

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
              accept=".smc"
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

        <div className="block">
          <button className="button is-primary" disabled={!filePath}>
            Use this Rom
          </button>
        </div>
      </div>
    </div>
  );
};
