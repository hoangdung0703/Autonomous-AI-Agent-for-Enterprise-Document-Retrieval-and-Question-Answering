const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const env = require('../config/env');

const unlinkAsync = promisify(fs.unlink);

class StorageService {
  constructor() {
    this.uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Multer already saves the file, so this might just return the absolute path or handle moving.
   * Assuming multer saves it, we just return the absolute path.
   * If we need to save manually:
   */
  getAbsolutePath(fileName) {
    return path.join(this.uploadDir, fileName);
  }

  async deleteFile(absolutePath) {
    try {
      if (fs.existsSync(absolutePath)) {
        await unlinkAsync(absolutePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${absolutePath}:`, error.message);
    }
  }
}

module.exports = new StorageService();
