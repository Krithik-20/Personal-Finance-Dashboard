import { useCallback, useRef, useState } from 'react';

const MAX_UPLOAD_SIZE = 200 * 1024 * 1024;

const parseFile = (file, setError, setSuccess, onParsed) => {
  if (file.size > MAX_UPLOAD_SIZE) {
    const sizeMB = (MAX_UPLOAD_SIZE / 1024 / 1024).toFixed(0);
    setError(`File is too large. Maximum upload size is ${sizeMB} MB.`);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
    .then(async (res) => {
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Upload failed');
      }
      setSuccess('File parsed successfully. Ready for categorization.');
      onParsed(json.transactions);
    })
    .catch((err) => {
      setError(err.message);
    });
};

export default function CSVUpload({ onSuccess, onError, onCategorize, loading, transactions }) {
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      setLocalError('');
      setLocalSuccess('');
      if (!file) {
        setLocalError('No file provided.');
        onError('No file provided.');
        return;
      }
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setLocalError('Please upload a valid CSV file.');
        onError('Please upload a valid CSV file.');
        return;
      }
      parseFile(file, (message) => {
        setLocalError(message);
        onError(message);
      },
      (message) => {
        setLocalSuccess(message);
      },
      (items) => {
        onSuccess(items);
      });
    },
    [onError, onSuccess]
  );

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  return (
    <section className="upload-section">
      <div className={`upload-card ${dragActive ? 'drag-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div>
          <h2>Upload Transaction CSV</h2>
          <p>Drag and drop a bank transaction CSV or click to select a file.</p>
          <button type="button" className="primary-button" onClick={() => inputRef.current?.click()}>
            Choose CSV File
          </button>
          <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} hidden />
        </div>
      </div>
      <div className="upload-actions">
        <button className="secondary-button" disabled={!transactions.length || loading} onClick={() => onCategorize(transactions)}>
          {loading ? 'Categorizing...' : 'Categorize Transactions'}
        </button>
      </div>
      {localError && <div className="alert alert-error">{localError}</div>}
      {localSuccess && <div className="alert alert-success">{localSuccess}</div>}
    </section>
  );
}
