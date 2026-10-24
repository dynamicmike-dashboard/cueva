import React, { useState, useMemo } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, startOfDay, endOfDay, isWithinInterval,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Users, Clock, Calendar as CalendarIcon, 
  LayoutGrid, List, MapPin, Eye, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Reservation {
  id: string;
  name: string;
  date: string;
  time: string;
  guests: number | string;
  restaurant: string;
  phone?: string;
  email?: string;
  is_resident?: boolean;
}

interface CalendarSystemProps {
  reservations: Reservation[];
  blackouts?: any[];
  lang: 'en' | 'es';
  activeFilter?: 'All' | 'Amate' | 'Cueva';
  onFilterChange?: (f: 'All' | 'Amate' | 'Cueva') => void;
  onSelectEvent: (event: Reservation) => void;
  onSelectBlackout?: (blackout: any) => void;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  if (/AM|PM/i.test(timeStr)) return timeStr;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
};

const CalendarSystem: React.FC<CalendarSystemProps> = ({ 
  reservations, 
  blackouts = [], 
  onSelectEvent, 
  onSelectBlackout,
  lang, 
  activeFilter = 'All', 
  onFilterChange 
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const filter = activeFilter;
  const setFilter = onFilterChange || (() => {});

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const matchRest = filter === 'All' || 
        (filter === 'Amate' && r.restaurant?.toLowerCase().includes('amate')) ||
        (filter === 'Cueva' && r.restaurant?.toLowerCase().includes('cueva'));
      return matchRest;
    });
  }, [reservations, filter]);

  const filteredBlackouts = useMemo(() => {
    return blackouts.filter(b => {
      const rest = (b.restaurant || 'Amate 38').toLowerCase();
      if (filter === 'All') return true;
      if (filter === 'Amate') return rest.includes('amate');
      if (filter === 'Cueva') return rest.includes('cueva') || rest.includes('chango');
      return false;
    });
  }, [blackouts, filter]);

  const renderHeader = () => (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 justify-between md:justify-start w-full md:w-auto">
          <button 
            onClick={() => setCurrentDate(prev => viewMode === 'month' ? subMonths(prev, 1) : viewMode === 'week' ? addDays(prev, -7) : addDays(prev, -1))}
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[var(--primary)]"
          >
            <ChevronLeft size={20} className="text-[var(--primary)]" />
          </button>
          <div className="text-center min-w-[140px]">
            <h2 className="text-lg font-serif font-bold text-[var(--primary)]">
              {format(currentDate, viewMode === 'day' ? 'MMM d, yyyy' : 'MMMM yyyy', { locale: lang === 'es' ? es : undefined })}
            </h2>
          </div>
          <button 
            onClick={() => setCurrentDate(prev => viewMode === 'month' ? addMonths(prev, 1) : viewMode === 'week' ? addDays(prev, 7) : addDays(prev, 1))}
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-[var(--primary)]"
          >
            <ChevronRight size={20} className="text-[var(--primary)]" />
          </button>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto justify-center">
          {(['month', 'week', 'day'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                viewMode === mode ? 'bg-[var(--primary)] text-[var(--primary-beige)]' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {mode === 'month' ? (lang === 'es' ? 'Mes' : 'Month') :
               mode === 'week' ? (lang === 'es' ? 'Semana' : 'Week') :
               (lang === 'es' ? 'Día' : 'Day')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['All', 'Amate', 'Cueva'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
              filter === f 
                ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]' 
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {f === 'Cueva' ? 'La Cueva' : f === 'Amate' ? 'Amate 38' : (lang === 'es' ? 'Todos' : 'All Venues')}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const daysOfWeek = lang === 'es' 
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map(d => (
          <div key={d} className="text-center py-2 text-[8px] font-black text-white/20 uppercase tracking-widest">{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayRes = filteredReservations.filter(r => r.date === dayStr);
          const isSelected = isSameDay(day, currentDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isHoliday = day.getMonth() === 11 && (day.getDate() === 24 || day.getDate() === 31);

          return (
            <button
              key={i}
              onClick={() => { setCurrentDate(day); setViewMode('day'); }}
              className={`min-h-[70px] p-1.5 border rounded-xl flex flex-col gap-1 transition-all ${
                isHoliday 
                  ? 'border-red-500/20 bg-red-500/5' 
                  : isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-white/5 bg-white/5'
              } ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}`}
            >
              <span className={`text-[10px] font-bold ${isHoliday ? 'text-red-600' : isSelected ? 'text-[var(--primary)]' : 'text-white/40'}`}>
                {format(day, 'd')}
                {isHoliday && <span className="ml-1 text-[7px] text-red-500 font-black uppercase">{lang === 'es' ? 'CERRADO' : 'CLOSED'}</span>}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-1 px-1">
                {dayRes.map((r, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full shadow-sm ${r.restaurant?.toLowerCase().includes('cueva') ? 'bg-emerald-400' : 'bg-[var(--primary)]'}`} 
                  />
                ))}
                {filteredBlackouts.filter(b => (b.date?.split('T')[0] || b.date) === dayStr).map((b, idx) => (
                  <div 
                    key={`b-${idx}`} 
                    className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" 
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <div className="grid grid-cols-7 gap-2 h-full min-h-[500px]">
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayRes = filteredReservations.filter(r => r.date === dayStr);
          const isToday = isSameDay(day, new Date());
          const isHoliday = day.getMonth() === 11 && (day.getDate() === 24 || day.getDate() === 31);

          return (
            <div key={dayStr} className={`flex flex-col bg-black/20 rounded-[32px] border ${isHoliday ? 'border-red-500/30' : isToday ? 'border-[var(--primary)]/40' : 'border-white/5'} overflow-hidden`}>
              <div className={`py-4 text-center border-b ${isHoliday ? 'bg-red-500/10 border-red-500/20' : isToday ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20' : 'bg-white/5 border-white/5'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isHoliday ? 'text-red-500' : isToday ? 'text-[var(--primary)]' : 'text-white/40'}`}>
                  {format(day, 'EEE', { locale: lang === 'es' ? es : undefined })}
                </p>
                <p className={`text-xl font-serif font-black ${isHoliday ? 'text-red-600' : isToday ? 'text-white' : 'text-white/60'}`}>
                  {format(day, 'd')}
                </p>
                {isHoliday && <span className="text-[7px] font-black text-red-500 uppercase tracking-widest block mt-0.5">{lang === 'es' ? 'CERRADO' : 'CLOSED'}</span>}
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto no-scrollbar">
                {isHoliday && (
                  <div className="p-3 rounded-2xl border border-red-200 bg-red-50 text-red-900 flex flex-col items-center justify-center text-center py-6 gap-1 shadow-sm">
                    <Lock size={16} className="text-red-600 animate-pulse" />
                    <span className="font-black text-[10px] text-red-800 uppercase tracking-wider">{lang === 'es' ? 'FESTIVO' : 'HOLIDAY'}</span>
                    <span className="font-bold text-[9px] text-red-600 uppercase">{lang === 'es' ? 'CERRADO' : 'CLOSED'}</span>
                  </div>
                )}
                {filteredBlackouts.filter(b => (b.date?.split('T')[0] || b.date) === dayStr).sort((a,b) => a.start_time.localeCompare(b.start_time)).map(b => (
                  <button 
                    key={`b-${b.id}`}
                    onClick={() => onSelectBlackout?.(b)}
                    className="w-full text-left p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-900 flex flex-col gap-1 uppercase tracking-tighter hover:bg-red-100 hover:translate-y-[-2px] transition-all hover:shadow-md active:scale-95"
                  >
                    <div className="flex justify-between items-center font-bold text-xs">
                      <span>{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</span>
                      <Lock size={11} className="text-red-600" />
                    </div>
                    <span className="truncate font-black text-[10px] text-red-800">{b.restaurant || 'Amate 38'}</span>
                    <span className="truncate italic font-bold text-[9px] text-red-600">{lang === 'es' ? 'CERRADO · CLIC PARA CANCELAR' : 'CLOSED · CLICK TO CANCEL'}</span>
                  </button>
                ))}
                {dayRes.sort((a,b) => {
                  const timeToNum = (t: string) => { const h = parseInt(t, 10); return /PM/i.test(t) && h < 12 ? h + 12 : /AM/i.test(t) && h === 12 ? 0 : h; };
                  const aNum = timeToNum(a.time) * 100 + parseInt(a.time.split(':')[1] || '0', 10);
                  const bNum = timeToNum(b.time) * 100 + parseInt(b.time.split(':')[1] || '0', 10);
                  return aNum - bNum;
                }).map(r => (
                  <button
                    key={r.id}
                    onClick={() => onSelectEvent(r)}
                    className={`w-full p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all hover:translate-y-[-2px] hover:shadow-xl active:scale-95 ${
                      r.restaurant?.toLowerCase().includes('cueva') 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_4px_12px_rgba(5,150,105,0.3)]' 
                        : 'bg-zinc-700/80 border-zinc-500/40 text-zinc-50'
                    }`}
                  >
                    <div className="flex justify-between items-center opacity-80">
                       <span className="text-[11px] font-black uppercase tracking-tight">{formatTime(r.time)}</span>
                       <span className="text-[11px] font-black">{r.guests}p</span>
                    </div>
                    <span className="text-xs font-bold truncate pr-1">{r.name}</span>
                  </button>
                ))}
                {dayRes.length === 0 && (
                  <div className="h-full border border-dashed border-white/5 rounded-2xl flex items-center justify-center opacity-10">
                    <span className="text-[10px] uppercase font-black -rotate-90">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayStr = format(currentDate, 'yyyy-MM-dd');
    const dayRes = filteredReservations
      .filter(r => r.date === dayStr)
      .sort((a,b) => {
        const timeToNum = (t: string) => { const h = parseInt(t, 10); return /PM/i.test(t) && h < 12 ? h + 12 : /AM/i.test(t) && h === 12 ? 0 : h; };
        const aNum = timeToNum(a.time) * 100 + parseInt(a.time.split(':')[1] || '0', 10);
        const bNum = timeToNum(b.time) * 100 + parseInt(b.time.split(':')[1] || '0', 10);
        return aNum - bNum;
      });

    const dayBlackouts = filteredBlackouts
      .filter(b => (b.date?.split('T')[0] || b.date) === dayStr)
      .sort((a,b) => a.start_time.localeCompare(b.start_time));

    return (
      <div className="space-y-6 px-4">
        <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-main)] opacity-100">
              {lang === 'es' 
                ? `${dayRes.length} Reservaciones y ${dayBlackouts.length} Bloqueados para ${format(currentDate, 'd MMMM', { locale: es })}`
                : `${dayRes.length} Reservations & ${dayBlackouts.length} Blocked for ${format(currentDate, 'MMMM d')}`}
            </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {dayBlackouts.map(b => (
              <button
                key={b.id}
                onClick={() => onSelectBlackout?.(b)}
                className="w-full p-6 rounded-[36px] border-2 bg-red-50 border-red-200 flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-red-100 text-left shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-xs font-black text-red-950">{b.start_time?.substring(0, 5)}</span>
                    <span className="text-[7px] font-black text-red-600 uppercase">{lang === 'es' ? 'Bloqueado' : 'Blocked'}</span>
                  </div>
                  <div className="text-left space-y-1">
                    <h4 className="text-xl font-serif font-bold text-red-950 italic group-hover:text-red-800 transition-colors">
                      {lang === 'es' ? 'RESTAURANTE COMPLETO' : 'RESTAURANT BOOKED OUT'}
                    </h4>
                    <p className="text-[10px] text-red-800 uppercase tracking-widest font-black flex items-center gap-2">
                      <Lock size={12} className="text-red-600" /> {b.restaurant} • {b.reason || (lang === 'es' ? 'Evento Privado' : 'Private Event')}
                    </p>
                    <p className="text-[9px] text-red-600 font-bold uppercase tracking-wide">
                      {lang === 'es' ? 'Clic para Cancelar Bloqueo' : 'Click to Cancel Book Out'}
                    </p>
                  </div>
                </div>
              </button>
          ))}
          {dayRes.length === 0 && dayBlackouts.length === 0 ? (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[48px] bg-white/5 backdrop-blur-sm">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/10">
                <CalendarIcon size={40} />
              </div>
              <p className="italic text-white/30 text-lg">No bookings scheduled for this day.</p>
            </div>
          ) : (
            dayRes.map(r => (
              <button
                key={r.id}
                onClick={() => onSelectEvent(r)}
                className={`w-full p-4 sm:p-6 rounded-[24px] sm:rounded-[36px] border-2 flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  r.restaurant?.toLowerCase().includes('cueva') 
                    ? 'bg-emerald-600 border-emerald-500 shadow-[0_8px_24px_rgba(5,150,105,0.25)] text-white' 
                    : 'bg-zinc-800/60 border-zinc-700/30'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center shadow-inner group-hover:border-[var(--primary)]/40 transition-colors">
                    <span className="text-sm sm:text-xl font-serif font-black text-white">{formatTime(r.time)}</span>
                    <span className="text-[8px] sm:text-[11px] font-black text-[var(--primary)] uppercase tracking-wide">Time</span>
                  </div>
                  <div className="text-left space-y-0.5 sm:space-y-1">
                    <h4 className="text-base sm:text-xl font-serif font-bold text-white group-hover:text-[var(--primary)] transition-colors truncate max-w-[120px] sm:max-w-none">{r.name}</h4>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-white/50">
                         <Users size={12} className="text-[var(--primary)]" />
                         <span className="text-[10px] sm:text-xs font-bold">{r.guests}p</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 text-white/50">
                         <MapPin size={12} className="text-[var(--primary)]" />
                         <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">
                           {r.restaurant?.split(' ')[0]}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-white/20 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-all border border-white/5">
                  <Eye size={16} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + currentDate.toISOString()}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarSystem;
