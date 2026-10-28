import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Trash2, User as UserIcon, Calendar, Clock, MapPin, AtSign, ChevronDown } from 'lucide-react';
import { apiAdmin } from '../../teable-client';

interface ReservationModalProps {
  reservation: any | null; 
  onClose: () => void;
  onRefresh: () => void;
  lang: 'en' | 'es';
  staffName?: string;
  defaultRestaurant?: string;
  password?: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ reservation, onClose, onRefresh, lang, staffName, defaultRestaurant, password }) => {
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

  const getReservationTimeSlots = (dateStr: string) => {
    if (!dateStr) return [];
    try {
      const dateObj = parseDateString(dateStr);
      if (!dateObj) return [];
      const day = dateObj.getDay();
      if (day === 0) return []; // Sunday is closed for reservations

      const month = dateObj.getMonth() + 1;
      const dayOfMonth = dateObj.getDate();
      if (month === 12 && (dayOfMonth === 24 || dayOfMonth === 31)) {
        return []; // Closed on Dec 24 and Dec 31
      }

      const start = day === 6 ? 14.5 : 8.0; // Sat: 2:30 PM, Mon-Fri: 8:00 AM
      const end = 21.5; // 9:30 PM
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

  const convertTo24Hour = (timeStr: string) => {
    if (!timeStr) return '';
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return timeStr; // already 24h or empty
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  };

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: reservation?.name || '',
    email: reservation?.email || '',
    guests: reservation?.guests || '2',
    date: reservation?.date || new Date().toISOString().split('T')[0],
    time: convertTo24Hour(reservation?.time) || (new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'America/Cancun' })),
    restaurant: reservation?.restaurant || defaultRestaurant || 'La Cueva del Chango',
  });

  const isEditing = !!reservation;

  const convertTo12Hour = (timeStr: string) => {
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


  const handleSave = async () => {
    // Validate reservation hours
    const time24 = formData.time; // e.g. "04:00" or "14:30"
    if (!time24) {
      alert(lang === 'es' ? 'Por favor seleccione una hora' : 'Please select a time');
      return;
    }
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const timeVal = h + m / 60;

    const dateObj = parseDateString(formData.date);
    const day = dateObj ? dateObj.getDay() : 0; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const month = dateObj ? dateObj.getMonth() + 1 : 0;
    const dayOfMonth = dateObj ? dateObj.getDate() : 0;

    if (month === 12 && (dayOfMonth === 24 || dayOfMonth === 31)) {
      alert(lang === 'es' ? 'Estamos cerrados para reservaciones el 24 y 31 de diciembre.' : 'We are closed for reservations on December 24th and December 31st.');
      return;
    }

    if (day === 0) {
      alert(lang === 'es' ? 'No aceptamos reservas los domingos.' : 'We do not take reservations on Sundays.');
      return;
    }

    if (day === 6) { // Saturday
      if (timeVal < 14.5 || timeVal > 21.5) {
        alert(lang === 'es' ? 'Los sábados solo aceptamos reservas de 2:30 pm a 9:30 pm.' : 'On Saturdays we only take reservations from 2:30 pm to 9:30 pm.');
        return;
      }
    } else { // Monday - Friday
      if (timeVal < 8.0 || timeVal > 21.5) {
        alert(lang === 'es' ? 'De lunes a viernes aceptamos reservas de 8:00 am a 9:30 pm.' : 'From Monday to Friday we take reservations from 8:00 am to 9:30 pm.');
        return;
      }
    }

    setLoading(true);
    try {
      const updatePayload = {
        name: formData.name,
        email: formData.email,
        guests: String(formData.guests),
        date: formData.date,
        time: convertTo12Hour(formData.time),
        restaurant: formData.restaurant
      };

      if (isEditing) {
        if (password) {
          const res = await fetch('/api/admin/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updatePayload, id: reservation.id, password })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed to update reservation');
        } else {
          const res = await fetch(`/api/admin/reservations/${reservation.id}?password=${password}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed to update reservation');
        }
      } else {
        // Use the API endpoint for new bookings to trigger confirmation emails
        const res = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save via API');
        }
      }
      onRefresh();
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(lang === 'es' ? `Error al guardar: ${e.message || 'Intente de nuevo'}` : `Error saving: ${e.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this reservation?')) {
      setLoading(true);
      try {
        if (password) {
          const res = await fetch(`/api/admin/reservations/${reservation.id}?password=${password}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed to delete reservation');
        } else {
          const res = await fetch(`/api/admin/reservations/${reservation.id}?password=${password}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed to delete reservation');
        }
        onRefresh();
        onClose();
      } catch (e: any) {
        console.error(e);
        alert(lang === 'es' ? `Error al eliminar: ${e.message || 'Intente de nuevo'}` : `Error deleting: ${e.message || 'Please try again'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-[var(--primary-beige)] border-2 border-[var(--primary)]/40 rounded-[48px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 sm:p-8 border-b border-[var(--primary)]/20 flex justify-between items-center bg-[var(--primary)]/5 shrink-0">
          <h3 className="text-xl sm:text-2xl font-serif font-black text-[var(--primary)] tracking-tight">{isEditing ? 'Edit Reservation' : 'New Reservation'}</h3>
          <button onClick={onClose} className="p-2 sm:p-3 bg-white/10 rounded-full text-white/70 hover:text-white transition-colors border border-white/10"><X size={20}/></button>
        </div>
        
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto no-scrollbar flex-1">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-widest flex items-center gap-2"><UserIcon size={12}/> Client Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white outline-none focus:border-[var(--primary)]/60" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-widest flex items-center gap-2"><Calendar size={12}/> Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-base text-white outline-none focus:border-[var(--primary)]/60" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-widest flex items-center gap-2"><Clock size={12}/> Time</label>
              <div className="relative">
                <select 
                  value={formData.time} 
                  onChange={e => setFormData({...formData, time: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-base text-white outline-none focus:border-[var(--primary)]/60 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-black bg-[var(--primary-beige)]">--:--</option>
                  {getReservationTimeSlots(formData.date).length === 0 ? (
                    <option value="" disabled className="text-black bg-[var(--primary-beige)]">
                      {lang === 'es' ? 'Fines de semana/Cerrado' : 'Weekends/Closed'}
                    </option>
                  ) : (
                    getReservationTimeSlots(formData.date).map(slot => (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-widest">Guests</label>
              <input type="number" min="1" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-white outline-none focus:border-[var(--primary)]/60 text-base sm:text-lg font-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-widest flex items-center gap-2"><MapPin size={12}/> Venue</label>
              <div className="relative">
                <select value={formData.restaurant} onChange={e => setFormData({...formData, restaurant: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-[var(--primary)]/60 appearance-none cursor-pointer">
                  <option value="La Cueva del Chango" className="text-black bg-[var(--primary-beige)]">La Cueva del Chango</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--primary)] z-10">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-widest flex items-center gap-2"><AtSign size={12}/> Contact / Email</label>
            <input type="text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white outline-none focus:border-[var(--primary)]/60" />
          </div>
        </div>

        <div className="p-6 bg-black/20 border-t border-white/5 flex items-center gap-3">
          {isEditing && (
             <button onClick={handleDelete} disabled={loading} className="px-4 py-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold flex items-center gap-2 transition-colors">
               <Trash2 size={18} />
             </button>
          )}
          <button onClick={handleSave} disabled={loading} className="flex-1 py-4 bg-[var(--primary)] text-[var(--primary-beige)] rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
            <Save size={18} /> {loading ? 'Saving...' : 'Save Reservation'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReservationModal;
