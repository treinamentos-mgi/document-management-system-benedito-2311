const multer = require('multer');

function publicMetadata(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function sendError(res, error) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo acima do limite permitido' });
    }
    return res.status(400).json({ error: 'Requisição inválida' });
  }

  if (error && error.status) {
    return res.status(error.status).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Erro interno do servidor' });
}

function createDocumentController(documentService, fileRepository) {
  async function upload(req, res) {
    try {
      const owner = req.header('X-User-Id')?.trim();
      const document = await documentService.upload(req.file, owner);
      return res.status(201).json(publicMetadata(document));
    } catch (error) {
      if (req.file) fileRepository.remove(req.file.filename);
      return sendError(res, error);
    }
  }

  async function list(req, res) {
    try {
      const owner = req.header('X-User-Id')?.trim();
      const documents = await documentService.listByOwner(owner);
      return res.status(200).json(documents.map(publicMetadata));
    } catch (error) {
      return sendError(res, error);
    }
  }

  async function download(req, res) {
    try {
      const owner = req.header('X-User-Id')?.trim();
      const document = await documentService.findForDownload(req.params.id, owner);

      return res.download(
        fileRepository.getFilePath(document.storedName),
        document.originalName,
        (error) => {
          if (error && !res.headersSent) sendError(res, error);
        },
      );
    } catch (error) {
      return sendError(res, error);
    }
  }

  return { upload, list, download, sendError };
}

module.exports = { createDocumentController, publicMetadata, sendError };
