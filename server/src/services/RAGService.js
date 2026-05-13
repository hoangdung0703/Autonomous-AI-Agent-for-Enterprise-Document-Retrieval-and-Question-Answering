const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const embedText = require('../utils/embedText');
const vectorDB = require('./VectorDBService');
const env = require('../config/env');
const { cache, generateCacheKey } = require('../utils/queryCache');
const logger = require('../utils/logger');

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

  async expandQuery(question) {
    try {
      const expansionPrompt = `Given this question: "${question}"
Generate 2 alternative phrasings that mean the same thing but use different words.
Return ONLY a JSON array with 2 strings, no explanation.
Example: ["alternative phrasing 1", "alternative phrasing 2"]`;

      const response = await this.llm.invoke(expansionPrompt);
      const text = response.content.trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [question, ...parsed.slice(0, 2)];
      }
    } catch (err) {
      logger.warn(`[RAGService] Query expansion failed, using original: ${err.message}`);
    }
    return [question]; // fallback to original if expansion fails
  }

  async query(question, documentIds = [], conversationHistory = []) {
    // 1. Check cache first
    const cacheKey = generateCacheKey(question, documentIds);
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug(`[RAGService] Cache hit for key: ${cacheKey.slice(0, 60)}...`);
      return cached;
    }
    logger.debug(`[RAGService] Cache miss — running RAG pipeline.`);

    // Expand query into multiple phrasings
    const expandedQueries = await this.expandQuery(question);
    logger.debug(`[RAGService] Expanded query into ${expandedQueries.length} phrasings`);

    // Embed and search for each phrasing
    const allChunks = [];
    for (const q of expandedQueries) {
      const qEmbedding = await embedText(q, env.GOOGLE_API_KEY);
      const chunks = await vectorDB.queryCollection(qEmbedding, 5, documentIds);
      allChunks.push(...chunks);
    }

    // Deduplicate by content, keep unique chunks only
    const seen = new Set();
    const uniqueChunks = allChunks.filter(chunk => {
      const key = chunk.chunkContent?.slice(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Use top 8 unique chunks (was retrievedChunks before)
    const retrievedChunks = uniqueChunks.slice(0, 8);

    // If no chunks are retrieved, fallback immediately or let LLM decide?
    // Let's pass it to LLM so it behaves exactly according to system prompt.
    const contextString = retrievedChunks.map((chunk, index) => {
      return `--- Chunk ${index + 1} ---\n${chunk.chunkContent}\n`;
    }).join('\n');

    const historyText = conversationHistory
      .slice(-4)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // 4. Build prompt
    const prompt = `
${this.systemPrompt}
${historyText ? `\nRecent conversation:\n${historyText}\n` : ''}
CONTEXT:
${contextString}

USER QUESTION:
${question}
`;

    // 5. Call Gemini
    const response = await this.llm.invoke(prompt);

    // 6. Build sources without exposing raw content
    const sources = retrievedChunks.map(chunk => ({
      fileName: chunk.metadata.fileName,
      chunkIndex: chunk.metadata.chunkIndex,
      excerpt: chunk.chunkContent?.slice(0, 400) || ''
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

    const result = {
      answer: response.content,
      sources: uniqueSources
    };

    // 7. Store in cache
    cache.set(cacheKey, result);
    logger.debug(`[RAGService] Cache stored for key: ${cacheKey.slice(0, 60)}...`);

    return result;
  }
}

module.exports = new RAGService();
