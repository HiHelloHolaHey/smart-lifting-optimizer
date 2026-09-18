import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
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
            <h2 className="text-2xl font-semibold mb-6 text-slate-100">Welcome Back</h2>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-6" loading={isLoading}>
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
