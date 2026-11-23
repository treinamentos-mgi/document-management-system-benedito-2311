const express = require('express');

function createDocumentRoutes({ controller, fileMiddleware }) {
  const router = express.Router();

  router.post('/upload', fileMiddleware.single('file'), controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  router.use((error, req, res, next) => controller.sendError(res, error));

  return router;
}

module.exports = { createDocumentRoutes };
