const crypto = require('crypto');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createDocumentService(documentRepository, config) {
  function requireOwner(owner) {
    if (!owner) throw createHttpError(401, 'X-User-Id é obrigatório');
  }

  async function upload(file, owner) {
    requireOwner(owner);
    if (!file) throw createHttpError(400, 'Arquivo ausente');
    if (!file.originalname || file.originalname.length > 255) {
      throw createHttpError(400, 'Nome do arquivo inválido');
    }
    if (!file.size || file.size <= 0) {
      throw createHttpError(400, 'Arquivo vazio');
    }
    if (file.size > config.maxFileSize) {
      throw createHttpError(413, 'Arquivo acima do limite permitido');
    }
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw createHttpError(415, 'Tipo de arquivo não permitido');
    }

    return documentRepository.add({
      id: crypto.randomUUID(),
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      owner,
      storedName: file.filename,
    });
  }

  async function listByOwner(owner) {
    requireOwner(owner);
    return documentRepository.findByOwner(owner);
  }

  async function findForDownload(id, owner) {
    requireOwner(owner);
    const document = documentRepository.findByIdAndOwner(id, owner);
    if (!document) throw createHttpError(404, 'Documento não encontrado');
    return document;
  }

  return { upload, listByOwner, findForDownload };
}

module.exports = { createDocumentService, createHttpError };
