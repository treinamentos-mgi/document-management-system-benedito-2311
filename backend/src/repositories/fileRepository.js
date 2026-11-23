const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

function createFileRepository(config) {
  fs.mkdirSync(config.storageDir, { recursive: true });

  const storage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, config.storageDir);
    },
    filename(req, file, callback) {
      const extension = path.extname(file.originalname);
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  });

  const middleware = multer({
    storage,
    limits: { fileSize: config.maxFileSize },
  });

  return {
    middleware,
    getFilePath(storedName) {
      return path.join(config.storageDir, storedName);
    },
    remove(storedName) {
      if (!storedName) return;
      fs.unlink(path.join(config.storageDir, storedName), () => {});
    },
  };
}

module.exports = { createFileRepository };
