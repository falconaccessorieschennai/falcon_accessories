'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firestore';
import ThemeToggle from '@/components/ui/ThemeToggle';
import type { Role } from '@/types';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile({
        uid: credential.user.uid,
        name,
        email,
        role,
        createdAt: Timestamp.now() as any,
      });
      window.location.href = role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError('Failed to create account. Please try again.');
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80')" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black border-2 border-primary mb-4 shadow-lg shadow-primary/20">
            <span className="text-primary font-black text-2xl tracking-tight">FA</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight uppercase">
            Falcon Accessories
          </h1>
          <p className="text-gray-400 text-xs mt-1 tracking-widest uppercase">
            Style · Comfort · Performance
          </p>
        </div>

        <div className="bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-text-primary text-xl font-bold mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-text-secondary text-sm font-medium mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="off"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-text-secondary text-sm font-medium mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-text-secondary text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="off"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-text-secondary text-sm font-medium mb-1.5">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={loading}
                className="w-full bg-surface-2 border border-border text-text-primary rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 transition"
              >
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            {error && (
              <p role="alert" className="text-error text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg px-4 py-3 text-sm transition-colors uppercase tracking-wide"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary-400 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
