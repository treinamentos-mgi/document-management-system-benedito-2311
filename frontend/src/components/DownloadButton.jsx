import { useState } from 'react';
import { downloadDocument } from '../services/apiClient.js';

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Adiado para garantir que o navegador já iniciou o download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function DownloadButton({ documentId, fileName, userId }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(documentId, userId);
      saveBlob(blob, fileName);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={downloading}>
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span role="alert" style={{ color: 'crimson', marginLeft: '0.5rem' }}>{error}</span>}
    </>
  );
}
