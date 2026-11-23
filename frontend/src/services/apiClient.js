const API_BASE_URL = '/api';

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    if (body.error) return body.error;
  } catch {
    // Resposta sem corpo JSON: usa a mensagem genérica abaixo.
  }
  return `Erro ${response.status} ao comunicar com o servidor`;
}

async function request(path, { userId, method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'X-User-Id': userId },
      body,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor');
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response;
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', { userId, method: 'POST', body: formData });
  return response.json();
}

export async function listDocuments(userId) {
  const response = await request('/documents', { userId });
  return response.json();
}

export async function downloadDocument(documentId, userId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`, {
    userId,
  });
  return response.blob();
}
