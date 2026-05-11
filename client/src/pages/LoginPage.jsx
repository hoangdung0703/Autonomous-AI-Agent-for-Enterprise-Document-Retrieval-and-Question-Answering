import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid email or password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background-primary px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 text-text-primary font-semibold text-xl mb-8 justify-center">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
            <span className="text-white text-sm">D</span>
          </div>
          DocMind
        </div>

        <div className="bg-background-elevated border border-border-subtle rounded-xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-text-primary mb-1">Welcome to DocMind</h1>
            <p className="text-sm text-text-secondary">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="admin@docmind.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />

            {error && (
              <div className="text-sm text-status-failed bg-status-failed-bg border border-status-failed/20 p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              loading={isSubmitting}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
