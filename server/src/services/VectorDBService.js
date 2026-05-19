const { ChromaClient } = require('chromadb');
const env = require('../config/env');
const logger = require('../utils/logger');

class VectorDBService {
  constructor() {
    this.client = new ChromaClient({
      url: env.CHROMA_HOST
    });
  }

  async connect(retries = 5, delayMs = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.client.heartbeat();
        logger.info('ChromaDB Connected successfully.');
        this.collection = await this.client.getOrCreateCollection({
          name: env.CHROMA_COLLECTION
        });
        logger.info(`ChromaDB Collection '${env.CHROMA_COLLECTION}' ready.`);
        return;
      } catch (error) {
        logger.error(`ChromaDB Connection Error (attempt ${attempt}/${retries}): ${error.message}`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
    logger.error('ChromaDB failed to connect after all retries. Server will start without ChromaDB.');
  }

  async upsertChunks(ids, embeddings, metadatas, documents) {
    if (!this.collection) throw new Error('Chroma collection not initialized');
    
    await this.collection.upsert({
      ids,
      embeddings,
      metadatas,
      documents
    });
  }

  async deleteByDocumentId(documentId) {
    if (!this.collection) throw new Error('Chroma collection not initialized');

    await this.collection.delete({
      where: { documentId: documentId }
    });
  }

  async queryCollection(queryEmbedding, nResults = 5, documentIds = []) {
    if (!this.collection) throw new Error('Chroma collection not initialized');

    const queryParams = {
      queryEmbeddings: [queryEmbedding],
      nResults,
    };

    // Apply document-scoped filter when documentIds are provided
    if (documentIds.length === 1) {
      // Use $eq for single value — more compatible with older ChromaDB clients
      queryParams.where = { documentId: { $eq: documentIds[0].toString() } };
    } else if (documentIds.length > 1) {
      queryParams.where = { documentId: { $in: documentIds.map(id => id.toString()) } };
    }

    const results = await this.collection.query(queryParams);

    if (!results || !results.documents || results.documents.length === 0 || results.documents[0].length === 0) {
      return [];
    }

    // Format response
    const chunks = [];
    for (let i = 0; i < results.documents[0].length; i++) {
      chunks.push({
        chunkContent: results.documents[0][i],
        metadata: results.metadatas[0][i]
      });
    }

    return chunks;
  }
}

module.exports = new VectorDBService();
