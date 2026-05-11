import { useDocuments } from '../hooks/useDocuments';
import UploadForm from '../components/documents/UploadForm';
import DocumentList from '../components/documents/DocumentList';

export default function DashboardPage() {
  const { documents, loading, error, uploadDocument, deleteDocument } = useDocuments();

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background-primary">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Document Management</h1>
          <p className="text-sm text-text-secondary">Upload and manage internal documents for the AI Agent.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-status-failed-bg border border-status-failed/20 text-status-failed rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
          {/* Left Column: Upload Form (40% on desktop) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <UploadForm onUpload={uploadDocument} />
          </div>

          {/* Right Column: Document List (60% on desktop) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <DocumentList 
              documents={documents} 
              loading={loading} 
              onDelete={deleteDocument} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
