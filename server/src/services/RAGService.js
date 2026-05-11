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

    this.systemPrompt = `You are a document assistant for enterprise knowledge management.
Answer the user's question using ONLY the provided context chunks below.
Rules:
- Be thorough and comprehensive — do not summarize too briefly
- If the question asks to "summarize" or "list", structure your answer with bullet points
- Cite specific details, names, dates, and numbers found in the context
- If the context contains both Vietnamese and English, prefer answering in the same language as the question
- If the context does not contain enough information, say: "I could not find sufficient information about this in the uploaded documents."
- Never use outside knowledge`;
  }

  async query(question, documentIds = []) {
    // 1. Embed the query
    const queryEmbedding = await embedText(question, env.GOOGLE_API_KEY);

    // 2. Retrieve top chunks from ChromaDB, optionally filtered by documentIds
    const retrievedChunks = await vectorDB.queryCollection(queryEmbedding, 8, documentIds);

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
