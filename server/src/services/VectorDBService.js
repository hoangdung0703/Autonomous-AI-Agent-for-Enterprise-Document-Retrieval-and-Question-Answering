const { ChromaClient } = require('chromadb');
const env = require('../config/env');
const logger = require('../utils/logger');

class VectorDBService {
  constructor() {
    // Parse CHROMA_HOST URL into host/port/ssl for chromadb v3.4.3 compatibility
    const chromaUrl = new URL(env.CHROMA_HOST);
    const ssl = chromaUrl.protocol === 'https:';
    const host = chromaUrl.hostname;
    const port = chromaUrl.port ? Number(chromaUrl.port) : (ssl ? 443 : 80);

    this.client = new ChromaClient({ host, port, ssl });
    this.collection = null;
  }

  async connect(retries = 5, delayMs = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.client.heartbeat();
        this.collection = await this.client.getOrCreateCollection({
          name: env.CHROMA_COLLECTION
        });
        logger.info(`ChromaDB Connected. Collection '${env.CHROMA_COLLECTION}' ready.`);
        return;
      } catch (error) {
        logger.error(`ChromaDB attempt ${attempt}/${retries}: ${error.message}`);
        if (attempt < retries) await new Promise(r => setTimeout(r, delayMs));
      }
    }
    logger.error('ChromaDB failed to connect after all retries.');
  }

  async ensureConnected() {
    if (!this.collection) await this.connect();
  }

  async upsertChunks(ids, embeddings, metadatas, documents) {
    await this.ensureConnected();
    await this.collection.upsert({ ids, embeddings, metadatas, documents });
  }

  async deleteByDocumentId(documentId) {
    await this.ensureConnected();
    await this.collection.delete({ where: { documentId } });
  }

  async queryCollection(queryEmbedding, nResults = 5, documentIds = []) {
    await this.ensureConnected();
    const queryParams = { queryEmbeddings: [queryEmbedding], nResults };
    if (documentIds.length === 1) {
      queryParams.where = { documentId: { $eq: documentIds[0].toString() } };
    } else if (documentIds.length > 1) {
      queryParams.where = { documentId: { $in: documentIds.map(id => id.toString()) } };
    }
    const results = await this.collection.query(queryParams);
    if (!results?.documents?.[0]?.length) return [];
    return results.documents[0].map((doc, i) => ({
      chunkContent: doc,
      metadata: results.metadatas[0][i]
    }));
  }
}

module.exports = new VectorDBService();
