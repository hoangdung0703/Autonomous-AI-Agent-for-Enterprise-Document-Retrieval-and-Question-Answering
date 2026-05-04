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
      chunkSize: 512,
      chunkOverlap: 50,
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

      // Generate embeddings in batches of 10
      let embeddingsList = [];
      const batchSize = 10;
      
      try {
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batchChunks = chunks.slice(i, i + batchSize);
          const batchPromises = batchChunks.map(chunk => embedText(chunk, env.GOOGLE_API_KEY));
          
          const batchResults = await Promise.all(batchPromises);
          embeddingsList.push(...batchResults);
        }
        
        console.log(`[DEBUG] embedDocuments returned list of size: ${embeddingsList?.length}`);
        if (embeddingsList && embeddingsList.length > 0) {
          console.log('[DEBUG] Raw first embedding:', JSON.stringify(embeddingsList[0]));
          console.log('[DEBUG] Type:', typeof embeddingsList[0]);
          console.log(`[DEBUG] Length of first embedding array: ${embeddingsList[0]?.length}`);
        }
      } catch (embedError) {
        console.error(`[EmbeddingService] embedDocuments failed:`, embedError);
        throw embedError;
      }

      if (!embeddingsList || !Array.isArray(embeddingsList) || embeddingsList.length === 0) {
        throw new Error('Embedding validation failed: Returned embeddings list is empty or invalid.');
      }

      for (let i = 0; i < embeddingsList.length; i++) {
        const emb = embeddingsList[i];
        if (!emb || !Array.isArray(emb) || emb.length === 0 || typeof emb[0] !== 'number') {
          throw new Error(`Embedding validation failed: Invalid embedding at index ${i}. Expected a non-empty array of numbers.`);
        }
      }

      const docRecord = await Document.findById(documentId);
      if (!docRecord) throw new Error('Document record not found');

      // Prepare payload for ChromaDB
      const ids = [];
      const metadatas = [];

      for (let i = 0; i < chunks.length; i++) {
        ids.push(`${documentId}_chunk_${i}`);
        metadatas.push({
          documentId: documentId.toString(),
          fileName: docRecord.fileName,
          chunkIndex: i,
          uploadedBy: uploadedBy.toString(),
          uploadedAt: docRecord.createdAt.toISOString()
        });
      }

      await vectorDB.upsertChunks(ids, embeddingsList, metadatas, chunks);

      docRecord.status = 'ready';
      docRecord.chunkCount = chunks.length;
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
