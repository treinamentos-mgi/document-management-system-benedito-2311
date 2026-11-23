const path = require('path');

const defaultMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

function readPositiveInteger(value, defaultValue) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}

const allowedMimeTypes = process.env.ALLOWED_MIME_TYPES
  ? process.env.ALLOWED_MIME_TYPES.split(',').map((value) => value.trim()).filter(Boolean)
  : defaultMimeTypes;

module.exports = {
  port: readPositiveInteger(process.env.PORT, 3000),
  storageDir: process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(__dirname, '..', 'storage'),
  maxFileSize: readPositiveInteger(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024),
  allowedMimeTypes,
};
