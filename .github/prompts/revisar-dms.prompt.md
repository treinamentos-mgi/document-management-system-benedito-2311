---
description: Revisa mudanças no DMS contra a arquitetura, as regras de ownership e as convenções do projeto.
name: revisar-dms
argument-hint: escopo da revisão (ex. backend/src/services ou "diff atual")
agent: agent
---

# Revisar mudanças do DMS

Revise `${input:escopo:escopo da revisão (ex. backend/src/services ou diff atual)}` como um revisor do Document Management System. Se o escopo for "diff atual" ou vazio, analise as alterações não commitadas e as do último commit.

Verifique, nesta ordem, e reporte apenas problemas reais, com `caminho:linha`:

## Arquitetura do backend

- O fluxo deve ser `routes -> controllers -> services -> repositories`. Camadas internas não podem importar camadas externas (ex.: service importando `express`, `multer` ou `req`/`res`).
- Controllers tratam apenas HTTP (entrada, status, JSON) e validação básica. Regras de negócio ficam em services.
- Repositories são os únicos responsáveis por persistência (memória e filesystem).

## Regras de negócio e segurança

- Operações sobre documentos devem exigir `X-User-Id` e filtrar por dono. Um usuário não pode listar, baixar ou alterar documentos de outro.
- Uploads são gravados apenas em `backend/storage` via `multer` com `diskStorage`. Nenhum provedor externo ou serviço de terceiros.
- Limites (`maxFileSize`) e tipos MIME (`allowedMimeTypes`) vêm de `config.js`, não de valores fixos no código.
- Configuração vem de variáveis de ambiente (12-Factor). Nenhum segredo ou caminho absoluto hardcoded.
- Arquivo gravado em disco deve ser removido se a requisição falhar depois do upload.

## Tratamento de erros

- Erros são tratados nos limites do sistema (entrada HTTP, leitura/escrita de arquivos).
- Erros HTTP devem usar `createHttpError` no service e `sendError` no controller, mantendo o formato `{ error: '...' }`.
- Nenhum erro interno vazado ao cliente (stack trace ou mensagem técnica).

## Convenções de código

- Símbolos (variáveis, funções, arquivos) em inglês. Mensagens ao usuário e comentários em português.
- Funções pequenas e com responsabilidade única. Sem abstrações desnecessárias (YAGNI).
- Comentários apenas quando algo precisar de esclarecimento.
- Sem dependências novas fora do `package.json` existente, a menos que justificado.
- Frontend: componentes funcionais com hooks, chamadas via `fetch` com prefixo `/api`, sem duplicação de componentes.

## Testes

- Mudanças de comportamento devem ter teste em `backend/test` usando `node:test` e `node:assert`.
- Verifique se os casos de erro (401, 400, 404, 413, 415) estão cobertos quando o código tratar esses cenários.

## Formato da resposta

1. Lista de problemas, ordenados por severidade (crítico, alto, médio, baixo), cada um com `caminho:linha`, a regra violada e a correção sugerida.
2. Itens verificados e conformes, em uma frase.
3. Se não houver problemas, diga isso explicitamente e aponte os riscos residuais.

Não edite arquivos nesta revisão, a menos que eu peça explicitamente.
