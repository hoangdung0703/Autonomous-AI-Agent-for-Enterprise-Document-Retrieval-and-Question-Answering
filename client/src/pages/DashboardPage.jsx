import { useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import UploadForm from '../components/documents/UploadForm';
import DocumentList from '../components/documents/DocumentList';
import RequestsTab from '../components/dashboard/RequestsTab';
import InviteCodesTab from '../components/dashboard/InviteCodesTab';

export default function DashboardPage() {
  const { documents, loading, error, uploadDocument, deleteDocument } = useDocuments();
  const [activeTab, setActiveTab] = useState('documents');

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background-primary">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 border-b border-border-subtle">
          <div className="flex gap-6">
            <button
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setActiveTab('requests')}
            >
              Member Requests
            </button>
            <button
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invites'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setActiveTab('invites')}
            >
              Invite Codes
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-status-failed-bg border border-status-failed/20 text-status-failed rounded-xl text-sm">
            {error}
          </div>
        )}

        {activeTab === 'documents' ? (
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
        ) : activeTab === 'requests' ? (
          <div className="h-[calc(100vh-200px)] min-h-[500px]">
            <RequestsTab />
          </div>
        ) : (
          <div className="h-[calc(100vh-200px)] min-h-[500px]">
            <InviteCodesTab />
          </div>
        )}
      </div>
    </div>
  );
}
