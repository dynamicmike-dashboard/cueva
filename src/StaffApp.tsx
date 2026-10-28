import React, { useState, useEffect } from 'react';
import CalendarSystem from './components/CalendarSystem';
import ReservationModal from './components/ReservationModal';
import BlackoutPanel from './components/BlackoutPanel';
import { LANGUAGES, Language, TRANSLATIONS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, RefreshCw, Leaf, Calendar as CalendarIcon, Plus } from 'lucide-react';

const STAFF_TRANSLATIONS = {
  en: {
    operationalPortal: "Operational Portal",
    accessPasscode: "Access Passcode",
    authorize: "Authorize",
    reservations: "Reservations",
    bookOut: "Book Out",
    newBooking: "New Booking",
    incorrectPasscode: "Incorrect Passcode",
    connectionError: "Connection Error",
    authenticating: "Authorizing...",
    passcodePlaceholder: "Passcode",
    deleteBlockoutConfirm: "Delete this book-out?",
    deleteBlockoutFailed: "Failed to delete"
  },
  es: {
    operationalPortal: "Portal Operativo",
    accessPasscode: "Código de Acceso",
    authorize: "Autorizar",
    reservations: "Reservaciones",
    bookOut: "Bloquear Horario",
    newBooking: "Nueva Reserva",
    incorrectPasscode: "Código Incorrecto",
    connectionError: "Error de Conexión",
    authenticating: "Autorizando...",
    passcodePlaceholder: "Código",
    deleteBlockoutConfirm: "¿Eliminar este bloqueo?",
    deleteBlockoutFailed: "Error al eliminar"
  }
};

const StaffApp: React.FC = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [lang, setLang] = useState<Language>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'en') return LANGUAGES[0];
      if (urlLang === 'es') return LANGUAGES[1];
      const saved = localStorage.getItem('amate38_staff_lang');
      return saved ? JSON.parse(saved) : LANGUAGES[1];
    } catch (e) {
      return LANGUAGES[1];
    }
  });

  const s = STAFF_TRANSLATIONS[lang.code as 'en' | 'es'] || STAFF_TRANSLATIONS.es;

  useEffect(() => {
    localStorage.setItem('amate38_staff_lang', JSON.stringify(lang));
  }, [lang]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [blackouts, setBlackouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'reservations' | 'bookout'>('reservations');
  const [showModal, setShowModal] = useState(false);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [filter, setFilter] = useState<'All' | 'Amate' | 'Cueva'>('All');
  const [error, setError] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [isFocused, setIsFocused] = useState(true);
  const fetchReservations = async (passOverride?: string) => {
    const activePassword = passOverride || apiPassword;
    if (!activePassword) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations?password=${activePassword}`);
      const resData = await res.json();
      if (resData.success) {
        setReservations(resData.data || []);
      }
      
      const bRes = await fetch(`/api/admin/blackouts?password=${activePassword}`);
      const bData = await bRes.json();
      if (bData.success) {
        setBlackouts(bData.data || []);
      }
    } catch (err) {
      console.error("Fetch reservations error:", err);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (passcode.length < 4) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (data.success) {
        setStaffName(data.name);
        setApiPassword(data.adminPassword);
        setIsAuthorized(true);
        fetchReservations(data.adminPassword);
      } else {
        setError(data.error || s.incorrectPasscode);
        setPasscode('');
      }
    } catch (e) {
      setError(s.connectionError);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="admin-theme min-h-screen bg-[var(--primary-beige)] flex items-center justify-center p-6 text-[var(--text-main)] font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-beige)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8 text-center">
          <div className="w-24 h-24 bg-[var(--primary)]/10 border-2 border-[var(--primary)]/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-xl">
            <Leaf size={48} className="text-[var(--primary)]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-serif font-black text-[var(--text-main)] italic tracking-tighter">LA CUEVA <span className="text-[var(--primary)]">DEL CHANGO</span></h1>
            <p className="text-[var(--primary)] text-[12px] uppercase font-black tracking-[0.5em] mt-2">{s.operationalPortal}</p>
          </div>

          <div className="bg-white/80 border-2 border-[var(--primary)]/15 rounded-[48px] p-12 space-y-10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(6,92,47,0.15)]">
            <div className="space-y-6">
              <label className="text-[13px] text-[var(--primary)] font-black uppercase tracking-[0.4em] text-center w-full block">{s.accessPasscode}</label>
              <div 
                className="relative cursor-text group"
                onClick={() => document.getElementById('staff-pin-input')?.focus()}
              >
                <div className="flex justify-center gap-5">
                  {[0, 1, 2, 3].map((idx) => {
                    const isCurrent = passcode.length === idx && isFocused;
                    return (
                      <div 
                        key={idx} 
                        className={`w-14 h-18 rounded-2xl border-2 flex items-center justify-center text-4xl font-black transition-all duration-300 ${
                          passcode.length > idx 
                            ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-beige)] scale-110 shadow-[0_0_30px_rgba(6,92,47,0.3)]' 
                            : isCurrent 
                              ? 'border-[var(--primary)] bg-white ring-2 ring-[var(--primary)] scale-105 shadow-[0_0_15px_rgba(6,92,47,0.25)] animate-pulse text-[var(--primary)]'
                              : 'border-[var(--primary)]/20 bg-white/50 text-[var(--primary)]'
                        }`}
                      >
                        {passcode.length > idx ? '●' : ''}
                      </div>
                    );
                  })}
                </div>
                <input 
                  id="staff-pin-input"
                  type="password" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4} 
                  autoFocus 
                  value={passcode} 
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPasscode(val);
                    if (val.length === 4) setTimeout(() => handleLogin(), 100);
                  }}
                  className="absolute inset-0 opacity-0 cursor-text"
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-white text-xs font-black bg-red-600 p-4 rounded-2xl border-2 border-red-400 shadow-lg">
                {error}
              </motion.p>
            )}

            <button 
              onClick={handleLogin}
              disabled={passcode.length < 4}
              className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl ${passcode.length === 4 ? 'bg-[var(--primary)] text-[var(--primary-beige)] scale-105 active:scale-95 shadow-[0_20px_40px_rgba(6,92,47,0.3)]' : 'bg-[var(--primary)]/10 text-[var(--primary)]/40 border-2 border-[var(--primary)]/20 cursor-not-allowed opacity-80'}`}
            >
              {loading ? s.authenticating : s.authorize}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="admin-theme min-h-screen bg-[var(--primary-beige)] text-[#F8F9FA] font-sans p-4 sm:p-dashboard overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center glass-panel-heavy p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--primary)]/20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-[var(--primary)] border-2 border-[var(--primary)]/40 shrink-0">
                <Leaf size={28} className="sm:size-32" />
             </div>
             <div className="min-w-0">
               <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#F1E4C1] tracking-tight truncate leading-tight">{staffName}</h2>
               <p className="text-[9px] text-white/40 uppercase font-black tracking-[0.3em] mt-0.5">{s.operationalPortal}</p>
             </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-[var(--primary)]/10 overflow-x-auto no-scrollbar shrink-0">
            {(['reservations', 'bookout'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 lg:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  view === v 
                    ? 'bg-[var(--primary)] text-[var(--primary-beige)] shadow-xl scale-105' 
                    : 'bg-transparent text-[var(--primary)]/60 hover:text-[var(--primary)]/80 hover:bg-white/30'
                }`}
              >
                {v === 'reservations' ? s.reservations : s.bookOut}
              </button>
            ))}
          </div>
 
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
             <button onClick={() => { setActiveReservation(null); setShowModal(true); }} className="bg-[var(--primary)] text-[var(--primary-beige)] font-black rounded-2xl flex-1 lg:flex-none flex items-center justify-center gap-2 py-2.5 sm:py-3 text-[10px] sm:text-xs min-w-[140px] shadow-xl hover:scale-[1.02] transition-transform">
                <Plus size={16} /> {s.newBooking}
             </button>
             <button onClick={fetchReservations} className="p-2.5 sm:p-3 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 text-[var(--primary)] transition-all shadow-xl flex justify-center">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
             <button onClick={() => { setIsAuthorized(false); setPasscode(''); }} className="p-2.5 sm:p-3 bg-red-500/10 rounded-xl border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all shadow-xl flex justify-center">
                <LogOut size={18} />
             </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-black/30 border-2 border-white/10 rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-2xl relative min-h-[500px] sm:min-h-[750px] backdrop-blur-md"
          >
            {view === 'reservations' ? (
              <div className="h-full min-h-[500px] sm:h-[750px] p-1 sm:p-2">
                 <CalendarSystem 
                   reservations={reservations} 
                   blackouts={blackouts}
                   lang={lang.code as 'en' | 'es'} 
                   activeFilter={filter}
                   onFilterChange={setFilter}
                   onSelectEvent={(r) => { setActiveReservation(r); setShowModal(true); }} 
                   onSelectBlackout={async (b) => {
                      if (window.confirm(s.deleteBlockoutConfirm)) {
                        try {
                          const res = await fetch(`/api/admin/blackouts/${b.id}?password=${apiPassword}`, { method: 'DELETE' });
                          const data = await res.json();
                          if (data.success) {
                            fetchReservations();
                          } else {
                            alert(data.error || s.deleteBlockoutFailed);
                          }
                        } catch (e) {
                          console.error("Delete blackout error:", e);
                        }
                      }
                    }}
                 />
              </div>
            ) : (
              <div className="p-4 sm:p-8">
                <BlackoutPanel lang={lang} password={apiPassword} onRefreshCalendar={fetchReservations} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showModal && (
        <ReservationModal
          reservation={activeReservation}
          onClose={() => setShowModal(false)}
          onRefresh={fetchReservations}
          lang={lang.code as 'en' | 'es'}
          staffName={staffName}
          defaultRestaurant={filter === 'All' ? 'Amate 38' : filter === 'Cueva' ? 'La Cueva del Chango' : 'Amate 38'}
          password={apiPassword}
        />
      )}

      {/* Language Switcher for Staff */}
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

export default StaffApp;
