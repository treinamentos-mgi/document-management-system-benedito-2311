const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { once } = require('events');

// Os uploads de teste vão para um diretório temporário, nunca para backend/storage.
// Precisa ser definido antes de carregar o app, pois a config é lida na importação.
const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;

const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.closeAllConnections();
  server.close();
  fs.rmSync(storageDir, { recursive: true, force: true });
});

function uploadFile({ userId, name = 'relatorio.txt', type = 'text/plain', content = 'conteudo' }) {
  const form = new FormData();
  form.append('file', new Blob([content], { type }), name);
  const headers = userId ? { 'X-User-Id': userId } : {};
  return fetch(`${baseUrl}/upload`, { method: 'POST', headers, body: form });
}

test('POST /upload grava o arquivo e retorna os metadados', async () => {
  const content = 'olá, DMS';
  const response = await uploadFile({ userId: 'ana', content });
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.ok(body.id);
  assert.strictEqual(body.originalName, 'relatorio.txt');
  assert.strictEqual(body.size, Buffer.byteLength(content));
  assert.strictEqual(body.owner, 'ana');
  assert.ok(body.uploadedAt);
  assert.ok(fs.readdirSync(storageDir).some((file) => file.endsWith('.txt')));
});

test('POST /upload rejeita requisições sem X-User-Id ou sem arquivo', async () => {
  const semDono = await uploadFile({ userId: undefined });
  assert.strictEqual(semDono.status, 401);

  const form = new FormData();
  const semArquivo = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'ana' },
    body: form,
  });
  assert.strictEqual(semArquivo.status, 400);
});

test('POST /upload rejeita tipos de arquivo não permitidos', async () => {
  const response = await uploadFile({ userId: 'ana', type: 'application/x-msdownload', name: 'virus.exe' });
  assert.strictEqual(response.status, 415);
});

test('GET /documents lista somente os documentos do usuário', async () => {
  await uploadFile({ userId: 'bia', name: 'a.txt' });
  await uploadFile({ userId: 'bia', name: 'b.txt' });
  await uploadFile({ userId: 'caio', name: 'c.txt' });

  const response = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'bia' } });
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body.map((doc) => doc.originalName).sort(), ['a.txt', 'b.txt']);
  assert.ok(body.every((doc) => doc.owner === 'bia'));
});

test('GET /documents exige X-User-Id', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(response.status, 401);
});

test('GET /documents/:id/download devolve o conteúdo original do arquivo', async () => {
  const content = 'conteúdo para download';
  const upload = await uploadFile({ userId: 'dani', name: 'download.txt', content });
  const { id } = await upload.json();

  const response = await fetch(`${baseUrl}/documents/${id}/download`, {
    headers: { 'X-User-Id': 'dani' },
  });

  assert.strictEqual(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /download\.txt/);
  assert.strictEqual(await response.text(), content);
});

test('GET /documents/:id/download retorna 404 para outro dono ou id inexistente', async () => {
  const upload = await uploadFile({ userId: 'eva', name: 'privado.txt' });
  const { id } = await upload.json();

  const outroDono = await fetch(`${baseUrl}/documents/${id}/download`, {
    headers: { 'X-User-Id': 'fabio' },
  });
  assert.strictEqual(outroDono.status, 404);

  const inexistente = await fetch(`${baseUrl}/documents/nao-existe/download`, {
    headers: { 'X-User-Id': 'eva' },
  });
  assert.strictEqual(inexistente.status, 404);
});
