import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner('');
    const next = {};
    if (!email.trim()) next.email = 'Please enter your email.';
    if (!password) next.password = 'Please enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) {
        setBanner(NETWORK_ERROR);
      } else {
        const msg = data?.error || 'Something went wrong. Please try again.';
        let field = data?.field;
        if (!field) {
          if (data?.code === 'USER_NOT_FOUND') field = 'email';
          else if (data?.code === 'WRONG_PASSWORD') field = 'password';
        }
        if (field === 'email' || field === 'password') setErrors({ [field]: msg });
        else setBanner(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearField = (field) => setErrors((prev) => ({ ...prev, [field]: undefined }));

  return (
    <div className="min-h-screen bg-bg text-text flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-surface border-r border-border p-12">
        <div className="text-center max-w-md">
          <div className="bg-raised p-4 rounded-2xl inline-block mb-6 border border-border">
            <Dumbbell className="w-14 h-14 text-accent" />
          </div>
          <h1 className="text-4xl font-medium text-text mb-3 tracking-tight">Smart Lifting Optimizer</h1>
          <p className="text-lg text-text-muted">Quiet precision for progressive overload, smart scheduling, and recovery tracking.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-bg">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <h2 className="text-2xl font-medium mb-6 text-text">Welcome Back</h2>
            {banner && (
              <div role="alert" className="bg-danger/15 border border-danger/40 text-danger p-3 rounded-xl mb-6 text-sm">
                {banner}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  error={!!errors.email}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField('email');
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
                {errors.email && (
                  <p id="login-email-error" className="text-danger text-sm mt-1.5">
                    {errors.email}{' '}
                    {errors.email.startsWith('No account') && (
                      <Link to="/register" className="underline text-accent hover:opacity-80">
                        Create one
                      </Link>
                    )}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    error={!!errors.password}
                    className="pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearField('password');
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" className="text-danger text-sm mt-1.5">
                    {errors.password}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full mt-6" loading={isLoading} disabled={isLoading}>
                Sign In
              </Button>
            </form>
            <p className="mt-6 text-center text-text-muted text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent hover:underline font-medium">
                Create one
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
