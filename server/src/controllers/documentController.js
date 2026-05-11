const Document = require('../models/Document');
const storageService = require('../services/StorageService');
const embeddingService = require('../services/EmbeddingService');
const vectorDB = require('../services/VectorDBService');

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
      const documents = await Document.find()
        .populate('uploadedBy', 'name email role')
        .sort({ createdAt: -1 });
      
      res.status(200).json(documents);
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

      // Delete from ChromaDB
      await vectorDB.deleteByDocumentId(docId.toString());

      // Delete from local disk
      const absolutePath = storageService.getAbsolutePath(docRecord.fileName);
      await storageService.deleteFile(absolutePath);

      // Delete record
      await Document.findByIdAndDelete(docId);

      res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
