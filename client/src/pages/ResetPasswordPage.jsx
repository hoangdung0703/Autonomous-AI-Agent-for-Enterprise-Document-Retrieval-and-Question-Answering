import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import api from '../services/api';
import Input from '../components/ui/Input';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect immediately if no token in URL
  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  // Auto-redirect to login 2 seconds after success
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/login', { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden px-4"
      style={{ backgroundColor: '#0a0a0a', position: 'relative' }}>

      {/* Top-left accent glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-15%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(80px)'
      }} />

      {/* Bottom-right accent glow */}
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0, filter: 'blur(80px)'
      }} />

      {/* Center subtle mesh */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px', height: '800px',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Dot grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Starfield */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)
        `,
        backgroundSize: '120px 120px, 80px 80px',
        backgroundPosition: '0 0, 40px 40px'
      }} />

      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Archon" className="w-10 h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-text-primary">Set new password</h1>
          <p className="text-sm text-text-secondary mt-1">Choose a strong password for your account.</p>
        </div>

        <div
          className="rounded-xl p-10 relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(20,20,28,0.90)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative', zIndex: 1
          }}
        >
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.8) 30%, rgba(139,92,246,0.6) 70%, transparent)',
            marginBottom: '28px', borderRadius: '1px'
          }} />

          {success ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-status-ready-bg border border-status-ready/30 flex items-center justify-center mx-auto">
                <Lock size={20} className="text-status-ready" />
              </div>
              <p className="text-sm text-text-primary font-medium">Password reset!</p>
              <p className="text-xs text-text-muted">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                label="Confirm password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />

              {error && (
                <div className="text-sm text-status-failed bg-status-failed-bg border border-status-failed/20 p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-150 shadow-lg shadow-accent/20 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
