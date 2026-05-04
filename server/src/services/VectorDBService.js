const { ChromaClient } = require('chromadb');
const env = require('../config/env');

class VectorDBService {
  constructor() {
    this.client = new ChromaClient({
      path: env.CHROMA_HOST
    });
  }

  async connect() {
    try {
      // Ping chroma to verify connection
      await this.client.heartbeat();
      console.log('ChromaDB Connected successfully.');
      
      // Attempt to get or create the collection to ensure it's ready
      this.collection = await this.client.getOrCreateCollection({
        name: env.CHROMA_COLLECTION
      });
      console.log(`ChromaDB Collection '${env.CHROMA_COLLECTION}' ready.`);
    } catch (error) {
      console.error(`ChromaDB Connection Error: ${error.message}`);
      // Don't exit process strictly, just log error. Or maybe we should exit?
      // For now, allow server to start even if Chroma is down, but log heavily.
    }
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

  async queryCollection(queryEmbedding, nResults = 5) {
    if (!this.collection) throw new Error('Chroma collection not initialized');

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults
    });

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
