import React, { useState, useEffect } from 'react';
import { Language, COLORS } from '../constants';
import { Lock, Clock, Trash2, Calendar as CalendarIcon, RefreshCw, Edit2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface BlackoutPanelProps {
  lang: Language;
  password: string;
  onRefreshCalendar?: () => void;
}

const BlackoutPanel: React.FC<BlackoutPanelProps> = ({ lang, password, onRefreshCalendar }) => {
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  };

  const getBlackoutTimeSlots = (dateStr: string) => {
    if (!dateStr) return [];
    try {
      const dateObj = parseDateString(dateStr);
      if (!dateObj) return [];
      const day = dateObj.getDay();
      const isSunday = day === 0;

      const start = 8.0; // 8:00 AM
      const end = isSunday ? 14.0 : 22.5; // Sunday: 2:00 PM, Mon-Sat: 10:30 PM
      const slots = [];
      for (let t = start; t <= end; t += 0.5) {
        const h = Math.floor(t);
        const min = (t % 1) === 0.5 ? '30' : '00';
        slots.push(`${String(h).padStart(2, '0')}:${min}`);
      }
      return slots;
    } catch {
      return [];
    }
  };

  const [blackouts, setBlackouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeMode, setRangeMode] = useState<'custom' | 'whole' | 'evening'>('custom');
  const [newBlackout, setNewBlackout] = useState<{ id?: string, date: string, start_time: string, end_time: string, reason: string, restaurant: string }>({ 
    date: '', 
    start_time: '08:00', 
    end_time: '22:30', 
    reason: '',
    restaurant: 'Amate 38' 
  });

  const fetchBlackouts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blackouts?password=${password}`);
      const data = await res.json();
      if (data.success) setBlackouts(data.data || []);
    } catch (e) {
      console.error("Fetch blackouts error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) fetchBlackouts();
  }, [password]);

  // Handle auto-updating times based on active rangeMode and selected date
  useEffect(() => {
    if (!newBlackout.date) return;
    const dateObj = parseDateString(newBlackout.date);
    const isSunday = dateObj ? dateObj.getDay() === 0 : false;

    if (rangeMode === 'whole') {
      setNewBlackout(prev => ({
        ...prev,
        start_time: '08:00',
        end_time: isSunday ? '14:00' : '22:30',
        reason: lang.code === 'es' ? 'Cerrado todo el día' : 'Closed for Day'
      }));
    } else if (rangeMode === 'evening') {
      setNewBlackout(prev => ({
        ...prev,
        start_time: isSunday ? '12:00' : '19:00',
        end_time: isSunday ? '14:00' : '22:30',
        reason: lang.code === 'es' ? 'Cerrado por la tarde' : 'Evening Closed'
      }));
    }
  }, [newBlackout.date, rangeMode, lang.code]);

  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleAdd = async () => {
    if (!newBlackout.date || !newBlackout.start_time || !newBlackout.end_time) return;
    setLoading(true);
    try {
      // Check for overlapping book-outs
      const toMins = (tStr: string) => {
        const parts = tStr.split(':').map(Number);
        return parts[0] * 60 + (parts[1] || 0);
      };
      
      const newStart = toMins(newBlackout.start_time);
      const newEnd = toMins(newBlackout.end_time);
      const newDateClean = newBlackout.date.split('T')[0];

      const dateObj = parseDateString(newDateClean);
      const day = dateObj ? dateObj.getDay() : 0; // 0 = Sunday, 1-6 = Monday-Saturday
      const isSunday = day === 0;

      // Opening hours validation
      // Monday - Saturday: 8:00 AM to 10:30 PM (480 mins to 1350 mins)
      // Sunday: 8:00 AM to 2:00 PM (480 mins to 840 mins)
      const minMins = 480; // 8:00 AM
      const maxMins = isSunday ? 840 : 1350; // 2:00 PM or 10:30 PM

      if (newStart < minMins || newEnd > maxMins || newStart >= newEnd) {
        const errMsg = lang.code === 'es'
          ? `Horario fuera de servicio. Apertura: ${isSunday ? 'Domingos de 8:00 am a 2:00 pm' : 'Lunes a Sábado de 8:00 am a 10:30 pm'}.`
          : `Hours outside of operating limits. Opening hours: ${isSunday ? 'Sundays 8:00 am to 2:00 pm' : 'Monday to Saturday 8:00 am to 10:30 pm'}.`;
        setStatus({ type: 'error', msg: errMsg });
        setLoading(false);
        return;
      }

      const overlaps = blackouts.some(b => {
        if (newBlackout.id && b.id === newBlackout.id) return false; // skip self when editing
        const bDateClean = b.date?.split('T')[0];
        if (b.restaurant !== newBlackout.restaurant || bDateClean !== newDateClean) return false;
        
        const bStart = toMins(b.start_time);
        const bEnd = toMins(b.end_time);
        return (newStart < bEnd && newEnd > bStart);
      });

      if (overlaps) {
        setStatus({ type: 'error', msg: lang.code === 'es' ? '¡Este rango de tiempo coincide con otro bloqueo!' : 'This time range overlaps with an existing book-out!' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/admin/blackouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBlackout, password })
      });
      const data = await res.json();
      if (data.success) {
        setNewBlackout({ date: '', start_time: '08:00', end_time: isSunday ? '14:00' : '22:30', reason: '', restaurant: 'Amate 38' });
        setRangeMode('custom');
        fetchBlackouts();
        if (onRefreshCalendar) onRefreshCalendar();
        setStatus({ type: 'success', msg: lang.code === 'es' ? '¡Bloqueo confirmado!' : 'Book-out confirmed!' });
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message || (lang.code === 'es' ? 'Error al guardar.' : 'Failed to save.') });
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!window.confirm(lang.code === 'es' ? '¿Eliminar este bloqueo?' : 'Delete this book-out?')) return;
    try {
      const res = await fetch(`/api/admin/blackouts/${id}?password=${password}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBlackouts();
        if (onRefreshCalendar) onRefreshCalendar();
      }
    } catch (e) {
      console.error("Delete blackout error:", e);
    }
  };

  const setQuickRange = (type: 'whole' | 'evening') => {
    setRangeMode(type);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white/10 border border-white/20 rounded-[24px] sm:rounded-[40px] p-4 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
          <h3 className="text-[var(--primary)] font-serif font-bold text-lg sm:text-2xl flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center text-[var(--primary)]">
                <Lock size={16} className="sm:size-20" />
              </div>
              {lang.code === 'es' ? 'Bloquear Horario' : 'Book Out'}
          </h3>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setQuickRange('whole')}
              className={`flex-1 md:flex-none px-4 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all active:scale-95 ${
                rangeMode === 'whole'
                  ? 'bg-red-500 text-white border border-red-600 shadow-lg'
                  : 'bg-red-500/20 border border-red-500/40 text-red-100 hover:bg-red-500/30'
              }`}
            >
              {lang.code === 'es' ? 'Todo el día' : 'Whole Day'}
            </button>
            <button 
              onClick={() => setQuickRange('evening')}
              className={`flex-1 md:flex-none px-4 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all active:scale-95 ${
                rangeMode === 'evening'
                  ? 'bg-[var(--primary)] text-[var(--primary-beige)] border border-[var(--primary)] shadow-lg'
                  : 'bg-[#F8F9FA]/10 border border-white/20 text-white hover:bg-white/10'
              }`}
            >
              {lang.code === 'es' ? 'Tarde' : 'Evening'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8">
          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest pl-1">Venue</label>
            <div className="relative">
              <select 
                value={newBlackout.restaurant} 
                onChange={e => setNewBlackout({...newBlackout, restaurant: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[var(--primary)]/60 transition-all appearance-none cursor-pointer text-xs sm:text-sm font-bold"
              >
                <option value="Amate 38" className="bg-[var(--primary-beige)] text-black">Amate 38</option>
                <option value="La Cueva del Chango" className="bg-[var(--primary-beige)] text-black">La Cueva del Chango</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--primary)] z-10">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest pl-1 flex items-center gap-2">
              <CalendarIcon size={12} className="text-[var(--primary)]" /> Date
            </label>
            <input type="date" value={newBlackout.date} onChange={e => setNewBlackout({...newBlackout, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[var(--primary)]/60 outline-none transition-all text-xs sm:text-sm font-bold" />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-black tracking-widest pl-1">Reason</label>
            <input type="text" placeholder="Reason" value={newBlackout.reason} onChange={e => setNewBlackout({...newBlackout, reason: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[var(--primary)]/60 outline-none transition-all placeholder:text-white/10 text-xs sm:text-sm font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest pl-1 flex items-center gap-2">
                <Clock size={12} className="text-[var(--primary)]" /> Start
              </label>
              <div className="relative">
                <select 
                  value={newBlackout.start_time} 
                  disabled={rangeMode === 'whole'}
                  onChange={e => {
                    setNewBlackout({...newBlackout, start_time: e.target.value});
                    setRangeMode('custom');
                  }} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[var(--primary)]/60 outline-none transition-all appearance-none cursor-pointer text-[10px] sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="text-black bg-[var(--primary-beige)]">--:--</option>
                  {getBlackoutTimeSlots(newBlackout.date).length === 0 ? (
                    <option value="" disabled className="text-black bg-[var(--primary-beige)]">
                      {lang.code === 'es' ? 'Elige fecha' : 'Choose date'}
                    </option>
                  ) : (
                    getBlackoutTimeSlots(newBlackout.date).map(slot => (
                      <option key={slot} value={slot} className="text-black bg-[var(--primary-beige)]">{slot}</option>
                    ))
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--primary)] z-10">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest pl-1 flex items-center gap-2">
                <Clock size={12} className="text-[var(--primary)]" /> End
              </label>
              <div className="relative">
                <select 
                  value={newBlackout.end_time} 
                  disabled={rangeMode === 'whole'}
                  onChange={e => {
                    setNewBlackout({...newBlackout, end_time: e.target.value});
                    setRangeMode('custom');
                  }} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[var(--primary)]/60 outline-none transition-all appearance-none cursor-pointer text-[10px] sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="text-black bg-[var(--primary-beige)]">--:--</option>
                  {getBlackoutTimeSlots(newBlackout.date).length === 0 ? (
                    <option value="" disabled className="text-black bg-[var(--primary-beige)]">
                      {lang.code === 'es' ? 'Elige fecha' : 'Choose date'}
                    </option>
                  ) : (
                    getBlackoutTimeSlots(newBlackout.date).map(slot => (
                      <option key={slot} value={slot} className="text-black bg-[var(--primary-beige)]">{slot}</option>
                    ))
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--primary)] z-10">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {status && (
          <div className={`mt-4 p-3 rounded-xl text-center text-[10px] font-black uppercase tracking-widest ${status.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {status.msg}
          </div>
        )}
        
        <button 
          onClick={handleAdd} 
          disabled={!newBlackout.date || !newBlackout.start_time || !newBlackout.end_time || loading}
          className="mt-6 w-full py-4 bg-[var(--primary)] text-[var(--primary-beige)] font-black rounded-2xl text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <Lock size={16} />}
          {loading ? 'Processing...' : newBlackout.id ? 'Update Book Out' : 'Confirm Book Out'}
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-white/40 font-black uppercase text-[11px] tracking-[0.3em] px-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Active Book Out Periods
        </h3>
        {loading ? (
           <div className="flex justify-center py-12"><RefreshCw size={32} className="text-[var(--primary)] animate-spin opacity-20" /></div>
        ) : blackouts.length === 0 ? (
           <div className="bg-white/5 border-2 border-dashed border-white/5 rounded-[40px] p-20 text-center">
              <p className="text-white/20 italic text-lg">No book out periods defined.</p>
           </div>
        ) : (
          <div className="grid gap-4">
            {blackouts.map(b => (
              <div key={b.id} className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-center justify-between group hover:bg-white/10 transition-all shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white border border-white/10 shadow-inner group-hover:border-red-500/40 transition-colors">
                    <Lock size={20} className="text-red-400 opacity-60" />
                    <span className="text-[9px] font-black uppercase tracking-tighter mt-1 text-white/40">Blocked</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg flex items-center gap-3">
                      {(() => {
                        try {
                          return format(new Date(b.date + 'T00:00:00'), 'EEEE, MMM d');
                        } catch {
                          return b.date;
                        }
                      })()}
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${b.restaurant?.toLowerCase().includes('cueva') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--primary)]/20 text-[var(--primary)]'}`}>
                        {b.restaurant || 'Amate 38'}
                      </span>
                    </p>
                    <p className="text-sm text-white/50 flex items-center gap-2 mt-1 font-medium italic">
                      <Clock size={14} className="text-[var(--primary)]" />
                      {b.start_time} - {b.end_time} 
                      {b.reason && <span className="text-white/30 ml-2 not-italic">• {b.reason}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setNewBlackout({ id: b.id, date: b.date, start_time: b.start_time, end_time: b.end_time, reason: b.reason || '', restaurant: b.restaurant || 'Amate 38' });
                      setRangeMode('custom');
                    }} 
                    className="p-4 text-[var(--primary)]/40 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-2xl transition-all"
                  >
                    <Edit2 size={22} />
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id)} 
                    className="p-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackoutPanel;
