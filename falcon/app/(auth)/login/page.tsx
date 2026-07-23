'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, createUserProfile } from '@/lib/firestore';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      let role: string = 'employee';
      try {
        const profile = await getUserProfile(credential.user.uid);
        if (profile) {
          role = profile.role ?? 'employee';
        } else {
          // Profile document missing — create one so Firestore rules work
          await createUserProfile({
            uid: credential.user.uid,
            name: credential.user.displayName ?? credential.user.email?.split('@')[0] ?? 'User',
            email: credential.user.email ?? '',
            role: 'employee',
            createdAt: new Date() as any,
          });
        }
      } catch (profileErr) {
        console.warn('Could not fetch/create user profile:', profileErr);
      }
      if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/employee/dashboard');
      }
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
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

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black border-2 border-primary mb-4 shadow-lg shadow-primary/20">
            <span className="text-primary font-black text-2xl tracking-tight">FC</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight uppercase">
            Falcon Carx
          </h1>
          <p className="text-gray-400 text-xs mt-1 tracking-widest uppercase">
            Style · Comfort · Performance
          </p>
        </div>

        <div className="bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-text-primary text-xl font-bold mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="text-error text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg px-4 py-3 text-sm transition-colors uppercase tracking-wide"
            >
              {loading ? <><Spinner /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-text-secondary text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary-400 font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
