import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, updateToken } = useAuth();
  const { profile, loading, fetchProfile, updateProfile } = useProfile();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(
    () => localStorage.getItem('archon_avatar') || null
  );
  const [avatarBase64, setAvatarBase64] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarPreview(profile.avatar || null);
    }
  }, [profile]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('Image must be under 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setAvatarPreview(base64);
      setAvatarBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const avatarToSend = avatarBase64 !== undefined ? avatarBase64 : profile?.avatar;
      const data = await updateProfile({ name: name.trim(), avatar: avatarToSend });
      updateToken(data.token);
      addToast('Profile updated', 'success');
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const initial = (profile?.name || user?.name || '?')[0].toUpperCase();

  const glassCard = {
    backgroundColor: 'rgba(20,20,28,0.90)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-lg font-semibold text-text-primary mb-6">Profile</h1>

        <div className="rounded-xl p-6 space-y-5" style={glassCard}>
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.8) 30%, rgba(139,92,246,0.6) 70%, transparent)',
            marginBottom: '24px',
            borderRadius: '1px'
          }} />
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleAvatarClick}
              className="relative group"
              title="Click to change avatar"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-accent/30 group-hover:ring-accent/60 transition-all"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Change</span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-text-muted">Click to upload · max 2MB</p>
          </div>

          {/* Editable name */}
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
              className="w-full px-3 py-2 text-sm text-text-primary rounded-lg outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            />
          </div>

          {/* Read-only fields */}
          {[
            { label: 'Email', value: profile?.email || user?.email },
            { label: 'Role', value: profile?.role || user?.role },
            { label: 'Organization', value: profile?.organizationName || user?.organizationName || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <div
                className="w-full px-3 py-2 text-sm text-text-muted rounded-lg"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: 0.6
                }}
              >
                {value}
              </div>
            </div>
          ))}

          {/* Member since */}
          <div
            className="rounded-lg px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
          >
            <span className="text-xs text-text-muted">Member since</span>
            <span className="text-xs font-medium text-text-secondary">
              {formatDate(profile?.createdAt)}
            </span>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-150 disabled:opacity-50"
            style={{
              background: 'linear-gradient(to right, #6366f1, rgba(99,102,241,0.8))',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
            }}
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
