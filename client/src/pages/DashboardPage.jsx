import { useState, useEffect } from 'react';
import { FileText, Users, Clock, X } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useJoinRequests } from '../hooks/useJoinRequests';
import useOrgStats from '../hooks/useOrgStats';
import UploadForm from '../components/documents/UploadForm';
import DocumentList from '../components/documents/DocumentList';
import RequestsTab from '../components/dashboard/RequestsTab';
import InviteCodesTab from '../components/dashboard/InviteCodesTab';
import StatusBadge from '../components/documents/StatusBadge';
import api from '../services/api';

const StatCard = ({ icon, label, value, onClick, isActive }) => (
  <div
    onClick={onClick}
    className={`bg-background-elevated border rounded-xl p-4 flex items-center gap-4 transition-colors ${
      onClick ? 'cursor-pointer' : ''
    } ${
      isActive
        ? 'border-accent bg-accent-subtle'
        : 'border-border-subtle hover:border-border-default'
    }`}
  >
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
  const [activePanel, setActivePanel] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  useEffect(() => {
    if (activePanel === 'members') {
      api.get('/organizations/members').then(res => setMembers(res.data.members));
    }
  }, [activePanel]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<FileText size={20} className="text-accent" />}
            label="Total Documents"
            value={pagination?.total ?? documents.length}
            onClick={() => setActivePanel(prev => prev === 'documents' ? null : 'documents')}
            isActive={activePanel === 'documents'}
          />
          <StatCard
            icon={<Users size={20} className="text-status-ready" />}
            label="Organization Members"
            value={memberCount ?? '—'}
            onClick={() => setActivePanel(prev => prev === 'members' ? null : 'members')}
            isActive={activePanel === 'members'}
          />
          <StatCard
            icon={<Clock size={20} className="text-status-processing" />}
            label="Pending Requests"
            value={pendingRequests.length}
          />
        </div>

        {activePanel === 'documents' && (
          <div className="mb-6 bg-background-elevated border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-medium text-text-primary">Uploaded Documents</h3>
              <button onClick={() => setActivePanel(null)}>
                <X size={16} className="text-text-muted hover:text-text-primary" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {documents.map(doc => (
                <div key={doc._id} className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-0 hover:bg-background-hover">
                  <FileText size={16} className="text-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{doc.originalName}</p>
                    <p className="text-xs text-text-muted">{doc.chunkCount} chunks · {new Date(doc.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activePanel === 'members' && (
          <div className="mb-6 bg-background-elevated border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <h3 className="text-sm font-medium text-text-primary">Organization Members</h3>
              <button onClick={() => setActivePanel(null)}>
                <X size={16} className="text-text-muted hover:text-text-primary" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {members.map(member => (
                <div key={member._id} className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-0">
                  <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-accent">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{member.name}</p>
                    <p className="text-xs text-text-muted">{member.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    member.role === 'admin'
                      ? 'bg-accent-subtle text-accent'
                      : 'bg-background-primary text-text-muted'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div className="lg:col-span-5 flex flex-col h-full">
              <UploadForm onUpload={uploadDocument} />
            </div>
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
