import { useState, useEffect } from 'react';
import { FileText, Users, Clock } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useJoinRequests } from '../hooks/useJoinRequests';
import useOrgStats from '../hooks/useOrgStats';
import UploadForm from '../components/documents/UploadForm';
import DocumentList from '../components/documents/DocumentList';
import RequestsTab from '../components/dashboard/RequestsTab';
import InviteCodesTab from '../components/dashboard/InviteCodesTab';

const StatCard = ({ icon, label, value }) => (
  <div className="bg-background-elevated border border-border-subtle rounded-xl p-4 flex items-center gap-4">
    <div className="w-10 h-10 rounded-lg bg-background-primary flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { documents, pagination, loading, error, uploadDocument, deleteDocument, reprocessDocument } = useDocuments();
  const { pendingRequests, fetchPendingRequests } = useJoinRequests();
  const { memberCount } = useOrgStats();
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<FileText size={20} className="text-accent" />}
            label="Total Documents"
            value={pagination?.total ?? documents.length}
          />
          <StatCard
            icon={<Users size={20} className="text-status-ready" />}
            label="Organization Members"
            value={memberCount ?? '—'}
          />
          <StatCard
            icon={<Clock size={20} className="text-status-processing" />}
            label="Pending Requests"
            value={pendingRequests.length}
          />
        </div>

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
                onReprocess={reprocessDocument}
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
