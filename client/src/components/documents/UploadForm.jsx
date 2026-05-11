import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

export default function UploadForm({ onUpload }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (selectedFile) => {
    setError('');
    
    if (!selectedFile) return false;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only PDF, DOCX, and XLSX are allowed.');
      return false;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      setError('File is too large. Maximum size is 10MB.');
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      await onUpload(file);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-background-secondary rounded-xl border border-border-subtle p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Upload Document</h3>
      
      <div 
        className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer ${
          isDragOver ? 'border-accent bg-accent-subtle/30' : 'border-border-default hover:border-border-strong hover:bg-background-hover'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
          accept=".pdf,.docx,.xlsx,.xls"
        />
        
        {file ? (
          <div className="flex flex-col items-center animate-fade-in">
            <CheckCircle size={32} className="text-status-ready mb-3" />
            <p className="text-sm font-medium text-text-primary truncate max-w-[200px] mb-1">{file.name}</p>
            <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-background-elevated border border-border-subtle flex items-center justify-center mb-4">
              <Upload size={20} className="text-text-secondary" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">Drag PDF, DOCX, or XLSX here</p>
            <p className="text-xs text-text-muted">or click to browse files</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-status-failed mt-3 animate-fade-in">{error}</p>}
      
      <div className="mt-4 pt-4 border-t border-border-subtle flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!file || isUploading}
          loading={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
    </div>
  );
}
