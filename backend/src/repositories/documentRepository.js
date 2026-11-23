function createDocumentRepository(initialDocuments = []) {
  const documents = [...initialDocuments];

  return {
    add(document) {
      documents.push(document);
      return document;
    },
    findByOwner(owner) {
      return documents.filter((document) => document.owner === owner);
    },
    findByIdAndOwner(id, owner) {
      return documents.find((document) => document.id === id && document.owner === owner) || null;
    },
  };
}

module.exports = { createDocumentRepository };
