import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center bg-gradient-radial from-slate-900 to-slate-950 border-r border-slate-800">
        <div className="text-center">
          <div className="bg-electric-indigo/10 p-4 rounded-2xl inline-block mb-6 border border-electric-indigo/20">
            <Dumbbell className="w-16 h-16 text-electric-indigo" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-4 tracking-tight">Smart Lifting Optimizer</h1>
          <p className="text-xl text-slate-400 font-light">Train Smarter. Lift Heavier.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6 text-slate-100">Welcome Back</h2>
            {banner && (
              <div role="alert" className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm">
                {banner}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`input-field ${errors.email ? '!border-red-500' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearField('email'); }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
                {errors.email && (
                  <p id="login-email-error" className="text-red-400 text-sm mt-1.5">
                    {errors.email}{' '}
                    {errors.email.startsWith('No account') && (
                      <Link to="/register" className="underline text-electric-indigo hover:text-indigo-400">Create one</Link>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`input-field pr-12 ${errors.password ? '!border-red-500' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearField('password'); }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" className="text-red-400 text-sm mt-1.5">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full mt-6" loading={isLoading} disabled={isLoading}>
                Sign In
              </Button>
            </form>
            <p className="mt-6 text-center text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-electric-indigo hover:text-indigo-400 transition-colors">
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
