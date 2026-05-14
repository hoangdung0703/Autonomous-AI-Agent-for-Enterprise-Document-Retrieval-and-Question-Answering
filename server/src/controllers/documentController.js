const Document = require('../models/Document');
const storageService = require('../services/StorageService');
const embeddingService = require('../services/EmbeddingService');
const vectorDB = require('../services/VectorDBService');
const { cache } = require('../utils/queryCache');
const logger = require('../utils/logger');

class DocumentController {
  async upload(req, res, next) {
    try {
      if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
      }

      const { originalname, filename, mimetype, size } = req.file;
      // Decode Vietnamese/special characters — multer passes multipart headers as latin1
      let decodedName;
      try {
        decodedName = decodeURIComponent(escape(originalname));
      } catch {
        decodedName = originalname;
      }

      const docRecord = new Document({
        fileName: filename,
        originalName: decodedName,
        mimeType: mimetype,
        size,
        uploadedBy: req.user.id,
        organizationId: req.organizationId,
        status: 'processing'
      });

      await docRecord.save();

      // Start processing asynchronously (do not await)
      const absolutePath = storageService.getAbsolutePath(filename);
      embeddingService.processDocument(docRecord._id, absolutePath, mimetype, req.user.id);

      // Return immediately
      const responseDoc = docRecord.toObject();
      res.status(202).json({
        message: 'File uploaded and is being processed',
        document: responseDoc
      });

    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        Document.find({ organizationId: req.organizationId })
          .populate('uploadedBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Document.countDocuments({ organizationId: req.organizationId })
      ]);

      res.status(200).json({
        documents,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const docId = req.params.id;
      const docRecord = await Document.findById(docId);

      if (!docRecord) {
        res.status(404);
        throw new Error('Document not found');
      }

      // Verify document belongs to user's organization
      if (docRecord.organizationId?.toString() !== req.organizationId?.toString()) {
        res.status(403);
        throw new Error('Access denied');
      }

      // Delete from ChromaDB
      await vectorDB.deleteByDocumentId(docId.toString());

      // Delete from local disk
      const absolutePath = storageService.getAbsolutePath(docRecord.fileName);
      await storageService.deleteFile(absolutePath);

      // Delete record
      await Document.findByIdAndDelete(docId);

      // Invalidate all cached RAG queries since the document set changed
      cache.flushAll();
      logger.debug('[DocumentController] Cache flushed after document deletion.');

      res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
  async rename(req, res, next) {
    try {
      const { originalName } = req.body;
      if (!originalName || !originalName.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }

      const doc = await Document.findOne({
        _id: req.params.id,
        organizationId: req.organizationId
      });
      if (!doc) return res.status(404).json({ error: 'Document not found' });

      doc.originalName = originalName.trim();
      await doc.save();

      res.status(200).json({ document: doc });
    } catch (err) {
      next(err);
    }
  }

  async reprocess(req, res, next) {
    try {
      const doc = await Document.findOne({
        _id: req.params.id,
        organizationId: req.organizationId
      });
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      if (doc.status === 'processing') {
        return res.status(400).json({ error: 'Document is already being processed' });
      }

      // Reset status
      doc.status = 'processing';
      doc.chunkCount = 0;
      await doc.save();

      // Delete existing vectors for this document first
      await vectorDB.deleteByDocumentId(doc._id.toString());

      // Trigger re-embedding async
      const absolutePath = storageService.getAbsolutePath(doc.fileName);
      embeddingService.processDocument(doc._id, absolutePath, doc.mimeType, doc.uploadedBy)
        .catch(err => logger.error(`[Reprocess] Failed for doc ${doc._id}: ${err.message}`));

      res.status(202).json({ message: 'Document reprocessing started', documentId: doc._id });
    } catch (err) {
      next(err);
    }
  }

  async preview(req, res, next) {
    try {
      const doc = await Document.findOne({
        _id: req.params.id,
        organizationId: req.organizationId
      });
      if (!doc) return res.status(404).json({ error: 'Document not found' });

      const filePath = storageService.getAbsolutePath(doc.fileName);
      res.setHeader('Content-Type', doc.mimeType);
      const encodedName = encodeURIComponent(doc.originalName);
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedName}`);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DocumentController();
