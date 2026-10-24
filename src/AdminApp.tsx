import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import { LANGUAGES, Language } from './constants';

const AdminApp: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'en') return LANGUAGES[0];
      if (urlLang === 'es') return LANGUAGES[1];
      const saved = localStorage.getItem('amate38_admin_lang');
      return saved ? JSON.parse(saved) : LANGUAGES[1];
    } catch (e) {
      return LANGUAGES[1];
    }
  });

  useEffect(() => {
    document.body.style.backgroundColor = 'var(--primary-beige)';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  useEffect(() => {
    localStorage.setItem('amate38_admin_lang', JSON.stringify(lang));
  }, [lang]);

  return (
    <div className="min-h-screen bg-[var(--primary-beige)] text-[var(--text-main)] font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-beige)]">
      <div className="fixed inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full">
          <AdminDashboard lang={lang} setLang={setLang} />
        </div>
      </main>

      {/* Language Switcher for Admin */}
      <div className="fixed bottom-6 right-6 z-[100] flex bg-black/40 backdrop-blur-xl border border-white/20 p-1 rounded-2xl shadow-2xl">
        <button 
          onClick={() => setLang(LANGUAGES[0])}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${lang.code === 'en' ? 'bg-[var(--primary)] text-[var(--primary-beige)]' : 'text-white/40 hover:text-white/60'}`}
        >
          <span>🇺🇸</span>
          <span className="text-[10px] font-black uppercase">EN</span>
        </button>
        <button 
          onClick={() => setLang(LANGUAGES[1])}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${lang.code === 'es' ? 'bg-[var(--primary)] text-[var(--primary-beige)]' : 'text-white/40 hover:text-white/60'}`}
        >
          <span>🇲🇽</span>
          <span className="text-[10px] font-black uppercase">ES</span>
        </button>
      </div>
    </div>
  );
};

export default AdminApp;
