const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const vectorDB = require('./VectorDBService');
const Document = require('../models/Document');
const env = require('../config/env');
const embedText = require('../utils/embedText');

class EmbeddingService {
  constructor() {
    if (!env.GOOGLE_API_KEY || env.GOOGLE_API_KEY.trim() === '') {
      throw new Error('Startup Validation Failed: GOOGLE_API_KEY is missing or empty.');
    }
    
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 200,
    });
  }

  async processDocument(documentId, filePath, mimeType, uploadedBy) {
    try {
      const text = await this.extractText(filePath, mimeType);
      
      if (!text || text.trim() === '') {
        throw new Error('No extractable text found in document.');
      }

      const chunks = await this.splitter.splitText(text);
      if (chunks.length === 0) {
        throw new Error('Document resulted in 0 chunks.');
      }

      // Filter out chunks that are too short, mostly whitespace, or lack meaningful text
      const validChunks = chunks.filter(chunk => {
        const textContent = typeof chunk === 'string' ? chunk : chunk.pageContent;
        const cleaned = textContent.replace(/\s+/g, ' ').trim();
        if (cleaned.length < 50) return false;
        // Skip chunks where meaningful text ratio is too low
        const letters = (cleaned.match(/\p{L}/gu) || []).length;
        const ratio = letters / cleaned.length;
        if (ratio < 0.3) return false; // less than 30% actual letters = skip
        return true;
      });

      console.log(`[EmbeddingService] Skipped ${chunks.length - validChunks.length} invalid chunks out of ${chunks.length} total.`);

      if (validChunks.length === 0) {
        throw new Error('All chunks were filtered out as invalid (too short or whitespace-only).');
      }

      // Embed with retry: up to 3 retries per chunk, 3000ms between retries
      const embedWithRetry = async (chunk, maxRetries = 3) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const vector = await embedText(chunk, env.GOOGLE_API_KEY);
            return vector;
          } catch (err) {
            if (attempt < maxRetries) {
              console.warn(`[EmbeddingService] Retry ${attempt + 1}/${maxRetries} for chunk after error: ${err.message}`);
              await new Promise(r => setTimeout(r, 3000));
            } else {
              throw err;
            }
          }
        }
      };

      // Generate embeddings in batches of 2 with 2000ms delay after every batch
      const successfulEmbeddings = [];
      const batchSize = 2;

      for (let i = 0; i < validChunks.length; i += batchSize) {
        const batch = validChunks.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(chunk => embedWithRetry(chunk))
        );

        batchResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            successfulEmbeddings.push({ chunk: batch[idx], embedding: result.value });
          } else {
            console.warn(`[EmbeddingService] Chunk ${i + idx} failed embedding: ${result.reason?.message}`);
          }
        });

        // Rate-limit delay after every batch
        await new Promise(r => setTimeout(r, 2000));
      }

      if (successfulEmbeddings.length > 0) {
        console.log(`[DEBUG] Successfully embedded ${successfulEmbeddings.length} / ${validChunks.length} chunks.`);
      }
      const failedCount = validChunks.length - successfulEmbeddings.length;
      if (failedCount > 0) {
        console.warn(`[EmbeddingService] Skipped ${failedCount} chunks due to embedding failure.`);
      }

      if (successfulEmbeddings.length === 0) {
        throw new Error('Embedding failed: no chunks could be embedded successfully.');
      }

      const docRecord = await Document.findById(documentId);
      if (!docRecord) throw new Error('Document record not found');

      // Prepare payload for ChromaDB using only successful embeddings
      const ids = [];
      const embeddingsList = [];
      const metadatas = [];
      const chunkTexts = [];

      successfulEmbeddings.forEach(({ chunk, embedding }, i) => {
        ids.push(`${documentId}_chunk_${i}`);
        embeddingsList.push(embedding);
        metadatas.push({
          documentId: documentId.toString(),
          fileName: docRecord.fileName,
          chunkIndex: i,
          uploadedBy: uploadedBy.toString(),
          uploadedAt: docRecord.createdAt.toISOString()
        });
        chunkTexts.push(chunk);
      });

      await vectorDB.upsertChunks(ids, embeddingsList, metadatas, chunkTexts);

      docRecord.status = 'ready';
      docRecord.chunkCount = successfulEmbeddings.length;
      await docRecord.save();

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      await Document.findByIdAndUpdate(documentId, { status: 'failed' });
    }
  }

  async extractText(filePath, mimeType) {
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } 
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } 
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'application/vnd.ms-excel') {
      const workbook = xlsx.readFile(filePath);
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        text += xlsx.utils.sheet_to_txt(sheet) + '\n';
      });
      return text;
    }

    throw new Error(`Unsupported mimeType: ${mimeType}`);
  }
}

module.exports = new EmbeddingService();
