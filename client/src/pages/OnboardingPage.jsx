import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function OnboardingPage() {
  const { user, updateToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'

  // Create tab state
  const [orgName, setOrgName] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdOrg, setCreatedOrg] = useState(null); // { name, code }
  const [copied, setCopied] = useState(false);

  // Join tab state
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Waiting screen state
  const [waitingRequest, setWaitingRequest] = useState(null); // { orgName }

  // If user somehow has an org already, redirect home
  useEffect(() => {
    if (user?.organizationId) navigate('/');
  }, [user, navigate]);

  // Check for existing pending/rejected request on mount
  useEffect(() => {
    if (!user || user.organizationId) return;
    
    api.get('/join-requests/me').then(({ data }) => {
      if (data.request) {
        if (data.request.status === 'pending') {
          setWaitingRequest({ orgName: data.request.organizationId.name });
        } else if (data.request.status === 'rejected') {
          setActiveTab('join');
          setJoinError(`Your previous request to join ${data.request.organizationId.name} was rejected. You can submit a new request.`);
        }
      }
    }).catch(console.error);
  }, [user]);

  // Polling when waiting
  useEffect(() => {
    if (!waitingRequest) return;
    
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/join-requests/me');
        if (data.request?.status === 'approved') {
          clearInterval(interval);
          const refreshRes = await api.get('/auth/refresh-token');
          updateToken(refreshRes.data.token);
          navigate('/');
        } else if (data.request?.status === 'rejected') {
          clearInterval(interval);
          setWaitingRequest(null);
          setActiveTab('join');
          setJoinError(`Your request to join ${data.request.organizationId.name} was rejected by an admin.`);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [waitingRequest, navigate, updateToken]);

  // Auto-redirect 3 seconds after successful org creation
  useEffect(() => {
    if (!createdOrg) return;
    const timer = setTimeout(() => navigate('/'), 3000);
    return () => clearTimeout(timer);
  }, [createdOrg, navigate]);

  const handleCreate = async () => {
    setCreateError('');
    if (!orgName.trim() || orgName.trim().length < 3) {
      setCreateError('Organization name must be at least 3 characters');
      return;
    }
    setIsCreating(true);
    try {
      const { data } = await api.post('/organizations', { name: orgName.trim() });
      updateToken(data.token);
      setCreatedOrg({ name: data.organization.name, code: data.organization.code });
      addToast('Organization created!', 'success');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create organization');
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    setJoinError('');
    if (!inviteCode.trim()) {
      setJoinError('Please enter an invite code');
      return;
    }
    setIsJoining(true);
    try {
      const { data } = await api.post('/join-requests', { inviteCode: inviteCode.trim() });
      setWaitingRequest({ orgName: data.organization.name });
      addToast('Request sent — waiting for admin approval', 'info');
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid organization code');
      setIsJoining(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(createdOrg.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background-primary px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 text-text-primary font-semibold text-xl mb-8 justify-center">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
            <span className="text-white text-sm">D</span>
          </div>
          Archon
        </div>

        <div className="bg-background-elevated border border-border-subtle rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          {!waitingRequest && (
            <div className="flex border-b border-border-subtle">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'text-accent border-b-2 border-accent bg-background-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Create Organization
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'join'
                    ? 'text-accent border-b-2 border-accent bg-background-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Join Organization
              </button>
            </div>
          )}

          <div className="p-8">
            {/* === CREATE TAB === */}
            {activeTab === 'create' && !createdOrg && !waitingRequest && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h1 className="text-lg font-semibold text-text-primary mb-1">Create your workspace</h1>
                  <p className="text-sm text-text-secondary">You'll become the admin and get a shareable code</p>
                </div>
                <Input
                  label="Organization Name"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={isCreating}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                {createError && (
                  <div className="text-sm text-status-failed bg-status-failed-bg border border-status-failed/20 p-3 rounded-lg">
                    {createError}
                  </div>
                )}
                <Button className="w-full" onClick={handleCreate} loading={isCreating}>
                  Create Organization
                </Button>
              </div>
            )}

            {/* === CREATE SUCCESS === */}
            {activeTab === 'create' && createdOrg && !waitingRequest && (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-status-ready-bg border border-status-ready/30 flex items-center justify-center mx-auto">
                  <Check size={20} className="text-status-ready" />
                </div>
                <div>
                  <p className="text-base font-semibold text-text-primary">{createdOrg.name} created!</p>
                  <p className="text-sm text-text-secondary mt-1">Share this code with your team</p>
                </div>
                <div className="flex items-center gap-2 bg-background-primary border border-border-subtle rounded-lg px-4 py-3">
                  <span className="flex-1 text-center font-mono text-lg font-semibold text-accent tracking-widest">
                    {createdOrg.code}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-1.5 text-text-muted hover:text-text-primary transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check size={16} className="text-status-ready" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-text-muted">Redirecting you to the app in 3 seconds…</p>
              </div>
            )}

            {/* === JOIN TAB === */}
            {activeTab === 'join' && !waitingRequest && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h1 className="text-lg font-semibold text-text-primary mb-1">Join your team</h1>
                  <p className="text-sm text-text-secondary">Enter the invite code shared by your organization admin</p>
                </div>
                <Input
                  label="Invite Code"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  maxLength={6}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={isJoining}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                {joinError && (
                  <div className="text-sm text-status-failed bg-status-failed-bg border border-status-failed/20 p-3 rounded-lg">
                    {joinError}
                  </div>
                )}
                <Button className="w-full" onClick={handleJoin} loading={isJoining}>
                  Submit Request
                </Button>
              </div>
            )}

            {/* === WAITING SCREEN === */}
            {waitingRequest && (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center mx-auto mb-2">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-text-primary mb-1">Request Pending</h1>
                  <p className="text-sm text-text-secondary">
                    You've requested to join <span className="font-semibold text-text-primary">{waitingRequest.orgName}</span>
                  </p>
                </div>
                <div className="bg-background-primary border border-border-subtle rounded-lg p-4 my-2">
                  <p className="text-sm text-text-primary">Waiting for admin approval...</p>
                  <p className="text-xs text-text-muted mt-1">This page will automatically refresh.</p>
                </div>
                <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed" disabled>
                  Cancel Request
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-text-muted text-center mt-5">
          Logged in as <span className="text-text-secondary">{user?.email}</span>
        </p>
      </div>
    </div>
  );
}
