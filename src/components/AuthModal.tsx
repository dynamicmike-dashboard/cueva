import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, LogOut, Leaf } from 'lucide-react';
import { COLORS, TRANSLATIONS, Language } from '../constants';

interface AuthModalProps {
  lang: Language;
  onClose: () => void;
  onAuthSuccess: (userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ lang, onClose, onAuthSuccess }) => {
  const t = TRANSLATIONS[lang.code];
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, language: lang.code })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        if (data.user) {
          setSuccessMsg(
            lang.code === 'en'
              ? 'Account created! Check your email to confirm, then log in.'
              : '¡Cuenta creada! Revisa tu correo para confirmar y luego inicia sesión.'
          );
          setMode('login');
        }
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        if (data.user) {
          onAuthSuccess(data.user.id);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-[var(--primary-beige)] border border-white/20 rounded-[40px] p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Leaf size={32} color={COLORS.sandyGold} />
        </div>

        <h2 className="text-2xl font-serif font-bold text-[var(--primary)] text-center mb-2">
          {mode === 'login'
            ? (lang.code === 'en' ? 'Welcome Back' : 'Bienvenido de Vuelta')
            : (lang.code === 'en' ? 'Join La Cueva Del Chango' : 'Únete a La Cueva Del Chango')}
        </h2>
        <p className="text-white/40 text-xs text-center mb-8 italic">
          {lang.code === 'en'
            ? 'Sign in to access admin panel'
            : 'Inicia sesión para acceder al panel'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                {lang.code === 'en' ? 'Full Name' : 'Nombre Completo'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Andres Garcia"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[var(--primary)]/60 transition-colors"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
              {lang.code === 'en' ? 'Email' : 'Correo Electrónico'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="andres@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[var(--primary)]/60 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
              {t.password}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[var(--primary)]/60 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded-xl">{error}</p>}
          {successMsg && <p className="text-emerald-400 text-xs text-center bg-emerald-500/10 p-3 rounded-xl">{successMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[var(--primary)] text-[var(--primary-beige)] font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-[var(--primary-beige)]/30 border-t-[var(--primary-beige)] rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <><LogIn size={18} /> {t.login}</>
            ) : (
              <><UserPlus size={18} /> {lang.code === 'en' ? 'Create Account' : 'Crear Cuenta'}</>
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMsg(null); }}
          className="w-full py-3 bg-white/5 border border-white/10 text-white/60 font-bold rounded-2xl hover:bg-white/10 transition-all text-sm"
        >
          {mode === 'login'
            ? (lang.code === 'en' ? 'New here? Create an account' : '¿Nuevo aquí? Crea una cuenta')
            : (lang.code === 'en' ? 'Already have an account? Login' : '¿Ya tienes cuenta? Inicia sesión')}
        </button>
      </motion.div>
    </motion.div>
  );
};