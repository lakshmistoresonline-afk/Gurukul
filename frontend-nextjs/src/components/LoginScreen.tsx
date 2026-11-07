'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    try {
      // 1. Try Firebase Sign In
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      onLoginSuccess();
    } catch (err: any) {
      // 2. If account doesn't exist in Firebase yet, auto-register
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        try {
          await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          onLoginSuccess();
          return;
        } catch (createErr: any) {
          setError(`Firebase Auth Error (${err.code}): ${err.message || 'Authentication failed.'}`);
          return;
        }
      }
      const code = err.code || 'unknown';
      const msg = err.message || 'Failed to sign in with Firebase.';
      setError(`Firebase Auth Error (${code}): ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white/15 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-600/60 border border-indigo-400/40 text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <span>Gurukul AI Portal</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Welcome Back</h2>
          <p className="text-indigo-200 text-xs">Sign in to access your class curriculum & study modules.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-200 font-bold space-y-1">
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo-200">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. srinavts2016@gmail.com"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo-200">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-20 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-xl text-[11px] font-extrabold text-indigo-200 transition-all"
              >
                {showPassword ? 'Hide 👁️' : 'Show 👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating with Firebase...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
