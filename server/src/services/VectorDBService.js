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
    this.connect();
  }

  async connect() {
    // Non-blocking infinite retry loop — never throws, never blocks startup
    while (true) {
      try {
        await this.client.heartbeat();
        this.collection = await this.client.getOrCreateCollection({
          name: env.CHROMA_COLLECTION
        });
        logger.info(`ChromaDB Connected. Collection '${env.CHROMA_COLLECTION}' ready.`);
        return; // exit loop on success
      } catch (err) {
        logger.warn(`ChromaDB not ready, retrying in 15s: ${err.message}`);
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  }

  async ensureConnected() {
    if (!this.collection) {
      const err = new Error('ChromaDB is warming up. Please retry in a moment.');
      err.statusCode = 503;
      err.retryAfter = 30;
      throw err;
    }
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
