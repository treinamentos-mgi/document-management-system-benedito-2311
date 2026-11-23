import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/apiClient.js';

export default function App() {
  const [userId, setUserId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const trimmedUserId = userId.trim();

  useEffect(() => {
    if (!trimmedUserId) {
      setDocuments([]);
      setError('');
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);
    listDocuments(trimmedUserId)
      .then((items) => {
        if (ignore) return;
        setDocuments(items);
        setError('');
      })
      .catch((listError) => {
        if (!ignore) setError(listError.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [trimmedUserId, refreshKey]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '900px' }}>
      <h1>Document Management System</h1>

      <label>
        Identificador do usuário (X-User-Id):{' '}
        <input
          type="text"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="Ex.: maria"
        />
      </label>
      {!trimmedUserId && <p>Informe um identificador para enviar e listar seus documentos.</p>}

      <UploadComponent userId={trimmedUserId} onUploaded={() => setRefreshKey((key) => key + 1)} />

      <section>
        <h2>Meus documentos</h2>
        {trimmedUserId && (
          <DocumentList
            documents={documents}
            userId={trimmedUserId}
            loading={loading}
            error={error}
          />
        )}
      </section>
    </main>
  );
}
