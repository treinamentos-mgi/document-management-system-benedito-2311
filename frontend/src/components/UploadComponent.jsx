import { useState } from 'react';
import { uploadDocument } from '../services/apiClient.js';

export default function UploadComponent({ userId, onUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: 'error', text: 'Selecione um arquivo para enviar.' });
      return;
    }

    const form = event.currentTarget;
    setUploading(true);
    setFeedback(null);
    try {
      const document = await uploadDocument(selectedFile, userId);
      form.reset();
      setSelectedFile(null);
      setFeedback({ type: 'success', text: `"${document.originalName}" enviado com sucesso.` });
      onUploaded(document);
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          name="file"
          onChange={(event) => setSelectedFile(event.target.files[0] ?? null)}
          disabled={uploading || !userId}
        />
        <button type="submit" disabled={uploading || !userId || !selectedFile}>
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {feedback && (
        <p role={feedback.type === 'error' ? 'alert' : 'status'} style={{ color: feedback.type === 'error' ? 'crimson' : 'green' }}>
          {feedback.text}
        </p>
      )}
    </section>
  );
}
