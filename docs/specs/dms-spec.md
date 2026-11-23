# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos em uma aplicação web com armazenamento local e gestão simples por usuário.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (cada usuário vê apenas os próprios documentos)

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Autenticação real (login, senha, tokens)
- Compartilhamento de documentos entre usuários
- Exclusão e edição de documentos
- Persistência de metadados em banco de dados

## 3. Requisitos funcionais

| ID    | Requisito                                             | Critérios de aceite |
| ----- | ----------------------------------------------------- | ------------------- |
| RF-01 | O usuário pode enviar um documento                    | - Envio via `POST /upload` em `multipart/form-data`, campo `file`.<br>- Requisição sem header `X-User-Id` retorna 401.<br>- Arquivo com tipo fora da lista permitida retorna 415.<br>- Arquivo acima do limite de tamanho retorna 413.<br>- Envio válido retorna 201 com os metadados do documento (sem caminho interno).<br>- O arquivo é gravado em `backend/storage`. |
| RF-02 | O usuário pode listar os documentos enviados          | - `GET /documents` retorna 200 com a lista somente dos documentos do usuário identificado por `X-User-Id`.<br>- Usuário sem documentos recebe lista vazia (200).<br>- Cada item contém id, originalName, size, uploadedAt e owner. |
| RF-03 | O usuário pode baixar um documento pelo identificador | - `GET /documents/:id/download` retorna 200 com o conteúdo binário.<br>- Resposta inclui `Content-Disposition` com o `originalName`.<br>- Documento inexistente ou de outro usuário retorna 404.<br>- Requisição sem `X-User-Id` retorna 401. |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                 | Critérios de aceite |
| ------ | ------------------------------------------------------------------------- | ------------------- |
| RNF-01 | Arquivos gravados no filesystem local via multer com `diskStorage`        | - Diretório de destino é `backend/storage`.<br>- Nenhum provedor externo é usado. |
| RNF-02 | Metadados mantidos em memória nesta fase                                  | - Reiniciar o servidor limpa os metadados, sem alteração nos arquivos já gravados. |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor)                        | - `PORT`, diretório de storage e limite de tamanho são lidos de variáveis de ambiente, com valores padrão. |
| RNF-04 | Arquitetura em camadas (Clean Architecture simples)                       | - Dependências seguem `routes -> controllers -> services -> repositories`. |
| RNF-05 | Testes automatizados no backend com runner nativo do Node                 | - `npm test` executa os testes com `node:test` sem dependências extras. |
| RNF-06 | Erros tratados nos limites do sistema (entrada HTTP, I/O de arquivos)     | - Falhas de leitura/escrita retornam erro 500 com mensagem genérica, sem vazar caminhos internos. |

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                                                      |
| ------------ | ------ | -------------------------------------------------------------- |
| id           | string | Identificador único do documento (UUID)                        |
| originalName | string | Nome original do arquivo enviado                               |
| size         | number | Tamanho em bytes                                               |
| mimeType     | string | Tipo MIME informado no upload (uso interno para validação)     |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                                 |
| owner        | string | Valor do header `X-User-Id` do usuário dono                    |
| storedName   | string | Nome do arquivo no storage (uso interno, não exposto na API)   |

### Regras de validação

- `originalName`: obrigatório, máximo de 255 caracteres.
- `size`: maior que zero e menor ou igual ao limite configurado (padrão 10 MB).
- Tipos permitidos (padrão): PDF (`application/pdf`), PNG (`image/png`), JPG (`image/jpeg`), DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), TXT (`text/plain`).
- `owner`: obrigatório, não vazio.

## 6. Contratos de API

Todas as rotas de documentos exigem o header `X-User-Id`.

### POST /upload

- Entrada: `multipart/form-data` com o campo `file`; header `X-User-Id`.
- Saída `201`: metadados do documento criado (`id`, `originalName`, `size`, `uploadedAt`, `owner`).
- Erros: `400` (campo `file` ausente), `401` (sem `X-User-Id`), `413` (arquivo acima do limite), `415` (tipo não permitido).

Exemplo de resposta:

```json
{
  "id": "3f2c1a9e-6b7d-4e2a-9c1f-0a1b2c3d4e5f",
  "originalName": "contrato.pdf",
  "size": 20480,
  "uploadedAt": "2026-11-23T10:00:00.000Z",
  "owner": "user-1"
}
```

### GET /documents

- Entrada: header `X-User-Id`.
- Saída `200`: array com os metadados dos documentos do usuário.
- Erros: `401` (sem `X-User-Id`).

### GET /documents/:id/download

- Entrada: parâmetro `id`; header `X-User-Id`.
- Saída `200`: conteúdo binário com `Content-Type` do documento e `Content-Disposition: attachment; filename="<originalName>"`.
- Erros: `401` (sem `X-User-Id`), `404` (documento inexistente ou de outro usuário).

### GET /health

- Saída `200`: `{ "status": "ok" }`.

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples: `routes -> controllers -> services -> repositories`.
- Camadas internas não conhecem camadas externas (services não importam express).
- Identificação do usuário por header `X-User-Id`, sem autenticação nesta fase.
- Armazenamento de arquivos local via multer `diskStorage`; metadados em memória.
- Frontend em React + Vite com componentes funcionais, organizados em `components/`, `pages/` e `services/`.
- Comunicação do frontend com o backend via `fetch` com prefixo `/api` (proxy do Vite).
- Restrições de upload (limite de tamanho e tipos) definidas na seção 5 e configuráveis por variáveis de ambiente.

## 8. Plano de execução

Etapas na ordem de implementação. Itens marcados com (paralelo) podem ser feitos em conjunto.

1. Configuração: ler `PORT`, diretório de storage, limite de tamanho e lista de tipos a partir de variáveis de ambiente, com padrões.
2. Storage e repositórios: criar o repositório de arquivos (multer `diskStorage` em `backend/storage`) e o repositório de metadados em memória.
3. Serviços: regras de upload (validação de tipo e tamanho, criação de metadados), listagem por dono e busca para download com verificação de dono.
4. Controllers e rotas: `POST /upload`, `GET /documents`, `GET /documents/:id/download`, tratamento de erros HTTP (400, 401, 404, 413, 415, 500) e middleware de `X-User-Id`.
5. Testes backend (paralelo com 4 quando possível): testes de upload, listagem, download e erros com `node:test`.
6. Frontend services: funções de `fetch` para `/api/upload`, `/api/documents` e download, enviando `X-User-Id`.
7. Frontend componentes e páginas (paralelo com 6 após contratos fixos): formulário de upload, lista de documentos e ação de download, reutilizando componentes.
8. Integração e validação: executar backend e frontend, testar fluxo completo de upload, listagem e download e conferir critérios de aceite da seção 3.
