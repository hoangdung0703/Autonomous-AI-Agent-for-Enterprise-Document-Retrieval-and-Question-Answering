const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const embedText = require('../utils/embedText');
const vectorDB = require('./VectorDBService');
const env = require('../config/env');

class RAGService {
  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: env.GOOGLE_API_KEY,
      model: env.GEMINI_CHAT_MODEL,
      temperature: 0, // Deterministic answers
    });

    this.systemPrompt = "You are a document assistant. Answer ONLY using the provided context. If the context does not contain the answer, respond: 'I could not find this information in the uploaded documents.' Do not use outside knowledge.";
  }

  async query(question) {
    // 1. Embed the query
    const queryEmbedding = await embedText(question, env.GOOGLE_API_KEY);

    // 2. Retrieve top chunks from ChromaDB
    const retrievedChunks = await vectorDB.queryCollection(queryEmbedding, 5);

    // If no chunks are retrieved, fallback immediately or let LLM decide?
    // Let's pass it to LLM so it behaves exactly according to system prompt.
    const contextString = retrievedChunks.map((chunk, index) => {
      return `--- Chunk ${index + 1} ---\n${chunk.chunkContent}\n`;
    }).join('\n');

    // 3. Build prompt
    const prompt = `
${this.systemPrompt}

CONTEXT:
${contextString}

USER QUESTION:
${question}
`;

    // 4. Call Gemini
    const response = await this.llm.invoke(prompt);

    // 5. Build sources without exposing raw content
    const sources = retrievedChunks.map(chunk => ({
      fileName: chunk.metadata.fileName,
      chunkIndex: chunk.metadata.chunkIndex
    }));

    // Deduplicate sources for cleaner output (optional but good practice)
    const uniqueSources = [];
    const sourceTracker = new Set();
    for (const source of sources) {
      const key = `${source.fileName}-${source.chunkIndex}`;
      if (!sourceTracker.has(key)) {
        sourceTracker.add(key);
        uniqueSources.push(source);
      }
    }

    return {
      answer: response.content,
      sources: uniqueSources
    };
  }
}

module.exports = new RAGService();
