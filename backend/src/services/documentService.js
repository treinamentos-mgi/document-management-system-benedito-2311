const crypto = require('crypto');

const MAX_FILE_NAME_LENGTH = 255;

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertOwner(owner) {
  if (!owner) throw createHttpError(401, 'X-User-Id é obrigatório');
}

function assertValidUpload(file, config) {
  if (!file) throw createHttpError(400, 'Arquivo ausente');
  if (!file.originalname || file.originalname.length > MAX_FILE_NAME_LENGTH) {
    throw createHttpError(400, 'Nome do arquivo inválido');
  }
  if (!(file.size > 0)) throw createHttpError(400, 'Arquivo vazio');
  if (file.size > config.maxFileSize) {
    throw createHttpError(413, 'Arquivo acima do limite permitido');
  }
  if (!config.allowedMimeTypes.includes(file.mimetype)) {
    throw createHttpError(415, 'Tipo de arquivo não permitido');
  }
}

function buildDocumentMetadata(file, owner) {
  return {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename,
  };
}

function createDocumentService(documentRepository, config) {
  async function upload(file, owner) {
    assertOwner(owner);
    assertValidUpload(file, config);
    return documentRepository.add(buildDocumentMetadata(file, owner));
  }

  async function listByOwner(owner) {
    assertOwner(owner);
    return documentRepository.findByOwner(owner);
  }

  async function findForDownload(id, owner) {
    assertOwner(owner);
    const document = documentRepository.findByIdAndOwner(id, owner);
    if (!document) throw createHttpError(404, 'Documento não encontrado');
    return document;
  }

  return { upload, listByOwner, findForDownload };
}

module.exports = { createDocumentService, createHttpError };
