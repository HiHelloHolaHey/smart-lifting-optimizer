import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const rules = [
    { id: 'len', label: 'At least 8 characters', ok: password.length >= 8 },
    { id: 'letter', label: 'At least one letter', ok: /[A-Za-z]/.test(password) },
    { id: 'number', label: 'At least one number', ok: /\d/.test(password) },
  ];
  const allMet = rules.every((r) => r.ok);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = !!email.trim() && allMet && confirm === password && confirm.length > 0;

  const clearField = (field) => setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBanner('');
    setErrors({});
    setIsLoading(true);
    try {
      await register({ email: email.trim(), password });
      navigate('/onboarding');
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) {
        setBanner(NETWORK_ERROR);
      } else {
        const msg = data?.error || 'Something went wrong. Please try again.';
        let field = data?.field;
        if (!field && data?.code === 'EMAIL_TAKEN') field = 'email';
        if (field === 'email' || field === 'password') {
          setErrors({ [field]: msg, code: data?.code });
        } else {
          setBanner(msg);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            <h2 className="text-2xl font-semibold mb-6 text-slate-100">Create Account</h2>
            {banner && (
              <div role="alert" className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm">
                {banner}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  className={`input-field ${errors.email ? '!border-red-500' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearField('email'); }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'reg-email-error' : undefined}
                />
                {errors.email && (
                  <p id="reg-email-error" className="text-red-400 text-sm mt-1.5">
                    {errors.email}{' '}
                    {errors.code === 'EMAIL_TAKEN' && (
                      <Link to="/login" className="underline text-electric-indigo hover:text-indigo-400">Sign in instead</Link>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input-field pr-12 ${errors.password ? '!border-red-500' : ''}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearField('password'); }}
                    aria-invalid={!!errors.password}
                    aria-describedby={`reg-password-rules${errors.password ? ' reg-password-error' : ''}`}
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
                  <p id="reg-password-error" className="text-red-400 text-sm mt-1.5">{errors.password}</p>
                )}
                <ul id="reg-password-rules" className="mt-2 space-y-1">
                  {rules.map((r) => (
                    <li key={r.id} className={`flex items-center gap-2 text-sm transition-colors ${r.ok ? 'text-green-400' : 'text-slate-500'}`}>
                      {r.ok ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      <span>{r.label}</span>
                      <span className="sr-only">{r.ok ? '(met)' : '(not met)'}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-400 mb-1.5">Confirm password</label>
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`input-field ${mismatch ? '!border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={mismatch}
                  aria-describedby={mismatch ? 'reg-confirm-error' : undefined}
                />
                {mismatch && (
                  <p id="reg-confirm-error" className="text-red-400 text-sm mt-1.5">Passwords don't match</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-6" loading={isLoading} disabled={!canSubmit || isLoading}>
                Create Account
              </Button>
            </form>
            <p className="mt-6 text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-electric-indigo hover:text-indigo-400 transition-colors">
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
