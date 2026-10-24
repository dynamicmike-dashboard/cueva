import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu as MenuIcon, 
  Calendar, 
  Star, 
  History as HistoryIcon, 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  MessageSquare,
  Globe,
  QrCode,
  Settings,
  Plus,
  Minus,
  LogOut,
  Check,
  Clock,
  Download,
  Share,
  Mic,
  Volume2,
  User,
  Sparkles,
  Leaf,
  RefreshCw,
  Smartphone,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Mail
} from 'lucide-react';
import gsap from 'gsap';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { GoogleGenAI } from "@google/genai";
import { COLORS, MENU_DATA, LANGUAGES, HISTORY_TEXT, Language, TRANSLATIONS } from './constants';
import { chatWithAssistant } from './services/geminiService';
import { teableFrontend } from '../teable-client';
import AdminDashboard from './components/AdminDashboard';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { 
  format, 
  addDays, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  isBefore, 
  startOfDay 
} from 'date-fns';
import { es } from 'date-fns/locale';

// Deployment Sync: 2026-04-24T14:30:15Z - v3.0.12


// --- Types ---
interface LoyaltyReward {
  id: string;
  title_en: string;
  title_es: string;
  points_cost: number;
}

// --- Components ---

const Header = ({ lang, setLang }: {
  lang: Language;
  setLang: (l: Language) => void;
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] pointer-events-none safe-area-top">
      <div className="max-w-md mx-auto bg-[var(--primary)] px-5 py-3 flex justify-between items-center shadow-lg pointer-events-auto">
        {/* Text-only brand — La Cueva del Chango (asset-swappable via /images/branding/) */}
        <div
          className="text-xl sm:text-2xl font-black tracking-tight text-white"
          style={{ fontFamily: 'MyriadPro-Regular, Helvetica Neue, Arial, sans-serif', letterSpacing: '-0.01em' }}
        >
          LA CUEVA <span style={{ color: '#E8D3A7' }}>DEL CHANGO</span>
        </div>

        <div className="flex bg-white/20 p-1 rounded-xl gap-0.5">
          <button
            onClick={() => setLang(LANGUAGES[0])}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-black uppercase ${
              lang.code === 'en' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-white hover:bg-white/20'
            }`}
          >
            <span>🇺🇸</span>
            <span>EN</span>
          </button>
          <button
            onClick={() => setLang(LANGUAGES[1])}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-black uppercase ${
              lang.code === 'es' ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-white hover:bg-white/20'
            }`}
          >
            <span>🇲🇽</span>
            <span>ES</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// BottomNav removed — streamlined AI-centric experience.
// ResidentWelcomeModal removed — loyalty system deprecated per client request.
// Loyalty rewards removed as requested by the client in the 24mar26 review.
// Legacy AdminSection removed since we now use the dedicated components/AdminDashboard.tsx via admin.html


// --- Other Sections (Menu, Reserve, History, Reviews) ---
// (Keeping them similar to previous turn but with translations)

const MenuSection = ({ lang }: { lang: Language }) => {
  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Vegan', 'Desserts', 'Drinks', 'Wine', 'Group Events'];
  const categoryKeys: Record<string, string> = {
    'Breakfast': 'breakfast',
    'Lunch': 'lunch',
    'Dinner': 'dinner',
    'Vegan': 'vegan',
    'Desserts': 'desserts',
    'Drinks': 'drinks',
    'Wine': 'wine',
    'Group Events': 'groupEvents'
  };
  const [activeCategory, setActiveCategory] = useState('Breakfast');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang.code];
  const [activeSubCategory, setActiveSubCategory] = useState('');

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setMenuItems(data.data);
        } else {
          setMenuItems(MENU_DATA);
        }
      })
      .catch(() => setMenuItems(MENU_DATA));
  }, []);

  const eventSubCategories = useMemo(() => {
    const subs = new Set<string>();
    menuItems.forEach(item => {
      if (item.category.startsWith('Group Events: ')) {
        subs.add(item.category.split(': ')[1]);
      }
    });
    const sorted = Array.from(subs).sort((a, b) => {
      if (a.toLowerCase().includes('canape')) return -1;
      if (b.toLowerCase().includes('canape')) return 1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [menuItems]);

  useEffect(() => {
    if (activeCategory === 'Group Events' && !activeSubCategory && eventSubCategories.length > 0) {
      setActiveSubCategory(eventSubCategories[0]);
    }
  }, [activeCategory, eventSubCategories, activeSubCategory]);

  const filteredItems = useMemo(() => {
    const filtered = menuItems.filter(item => {
      if (activeCategory === 'Group Events') {
        return item.category === `Group Events: ${activeSubCategory}`;
      }
      return item.category === activeCategory;
    });

    // Enrich with images from MENU_DATA if missing
    return filtered.map(it => {
        if (!it.image) {
            const baked = MENU_DATA.find(m => m.name_en === it.name_en || m.name_es === it.name_es);
            if (baked?.image) return { ...it, image: baked.image };
        }
        return it;
    });
  }, [menuItems, activeCategory, activeSubCategory]);

  useEffect(() => {
    if (menuRef.current && menuRef.current.children.length > 0) {
      gsap.fromTo(
        menuRef.current.children,
        { opacity: 0, y: 20, rotateX: -15, transformOrigin: 'top center' },
        { 
          opacity: 1, 
          y: 0, 
          rotateX: 0, 
          stagger: 0.1, 
          duration: 0.6, 
          ease: 'power2.out' 
        }
      );
    }
  }, [activeCategory, activeSubCategory, filteredItems]);

  return (
    <div className={`pb-28 px-4 xs:px-6 max-w-4xl mx-auto`}>
      {/* Main Categories */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[11px] uppercase font-black tracking-widest transition-all`}
            style={{
              fontFamily: 'MyriadPro-Regular, sans-serif',
              backgroundColor: activeCategory === cat ? 'var(--primary)' : 'rgba(0, 0, 0, 0.05)',
              color: activeCategory === cat ? '#E8D3A7' : 'var(--text-main)',
              border: activeCategory === cat ? 'none' : '1px solid rgba(6, 92, 47, 0.2)'
            }}
          >
            {(t.menuCategories as any)?.[categoryKeys[cat]] || cat}
          </button>
        ))}
      </div>

      {/* Category Sub-Header */}
      {activeCategory === 'Breakfast' && (
        <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-[24px] text-center animate-fade-in">
          <p className="text-sm text-[var(--primary)] font-serif italic">
            {lang.code === 'es' 
              ? "Si desea conocer el especial de desayuno de hoy, comuníquese directamente con el restaurante." 
              : "If you would like to know today’s breakfast special, please contact the restaurant directly."}
          </p>
        </div>
      )}

      {['Lunch', 'Dinner'].includes(activeCategory) && (
        <div className="mb-8 text-center animate-fade-in">
           <h2 className="text-3xl font-serif font-black text-[var(--primary)] italic" style={{ fontFamily: 'MyriadPro-Regular, sans-serif' }}>
             {lang.code === 'es' ? `${(t.menuCategories as any)?.[categoryKeys[activeCategory]]} del día` : `Daily ${activeCategory}`}
           </h2>
           <div className="w-12 h-1 bg-[var(--primary)]/20 mx-auto mt-2 rounded-full" />
        </div>
      )}

      {/* Group Events Sub-Tabs */}
      {activeCategory === 'Group Events' && eventSubCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-none mb-2">
          {eventSubCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubCategory(sub)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] uppercase font-black tracking-tighter transition-all`}
              style={{
                fontFamily: 'MyriadPro-Regular, sans-serif',
                backgroundColor: activeSubCategory === sub ? 'var(--primary)' : 'rgba(0, 0, 0, 0.05)',
                color: activeSubCategory === sub ? '#E8D3A7' : 'var(--text-main)',
                border: activeSubCategory === sub ? 'none' : '1px solid rgba(6, 92, 47, 0.15)'
              }}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      <div ref={menuRef} className="grid gap-6">
        {filteredItems.map((item) => (
          <MenuCard 
            key={item.id} 
            item={item} 
            lang={lang} 
          />
        ))}
      </div>
    </div>
  );
};

function MenuCard({ item, lang }: any) {
  return (
    <div className="bg-black/5 border border-black/10 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
      <div className="h-1 bg-[var(--primary)]/10 w-full" />
      <div className="p-4 xs:p-6 text-[var(--text-main)]">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-serif font-bold text-[var(--primary)]">
            {lang.code === 'en' ? item.name_en : item.name_es}
          </h3>
          <span className="font-mono text-sm text-[var(--text-main)] shrink-0 ml-4 py-1 px-2 bg-black/5 rounded-lg border border-black/5">
            {item.price}
          </span>
        </div>
        <p className="text-sm text-[var(--text-main)]/70 leading-relaxed italic">
          {lang.code === 'en' ? item.description_en : item.description_es}
        </p>
      </div>
    </div>
  );
}

const CalendarView = ({ selectedDate, onSelect, lang }: { selectedDate: string, onSelect: (d: string) => void, lang: Language }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const today = startOfDay(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <button 
          type="button"
          onClick={() => setCurrentDate(addMonths(currentDate, -1))}
          className="p-2.5 text-[#065C2F] bg-[#065C2F]/5 hover:bg-[#065C2F]/10 rounded-2xl transition-all border border-[#065C2F]/10"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-serif font-black text-[#065C2F] tracking-tight capitalize" style={{ fontFamily: 'MyriadPro-Regular, sans-serif' }}>
          {format(currentDate, 'MMMM yyyy', { locale: lang.code === 'es' ? es : undefined })}
        </h3>
        <button 
          type="button"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2.5 text-[#065C2F] bg-[#065C2F]/5 hover:bg-[#065C2F]/10 rounded-2xl transition-all border border-[#065C2F]/10"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
          <div key={index} className="text-center text-[10px] font-black text-[#065C2F]/60 uppercase tracking-[0.2em] py-2">{d}</div>
        ))}
        {days.map((day, i) => {
          const iso = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDate === iso;
          const isPast = isBefore(day, today);
          const isCurrentMonth = isSameMonth(day, monthStart);

          const isSunday = day.getDay() === 0;
          const isHoliday = day.getMonth() === 11 && (day.getDate() === 24 || day.getDate() === 31);
          const disabled = isPast || isSunday || isSameDay(day, today) || isHoliday;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={`
                aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                ${isSelected 
                  ? 'bg-[#065C2F] text-white shadow-[0_10px_20px_rgba(6,92,47,0.2)] scale-110 z-10 border-none font-black' 
                  : 'text-[#065C2F] hover:bg-[#065C2F]/5 border border-transparent'}
                ${!isCurrentMonth ? 'opacity-20 pointer-events-none' : 'opacity-100'}
                ${disabled && !isSelected 
                  ? 'bg-gray-100/50 text-[#065C2F]/30 grayscale cursor-not-allowed' 
                  : ''}
              `}
            >
              <span className={`text-sm ${isSelected ? 'font-black' : 'font-bold'} ${disabled && !isSelected ? 'line-through text-[#065C2F]/40' : ''}`}>
                {format(day, 'd')}
              </span>
              {isHoliday && isCurrentMonth ? (
                <span className={`absolute bottom-1.5 text-[7px] font-black uppercase leading-none ${isSelected ? 'text-white' : 'text-red-700/80'}`}>
                  {lang.code === 'en' ? 'Closed' : 'Cerrado'}
                </span>
              ) : isSunday && isCurrentMonth && (
                <span className={`absolute bottom-1.5 text-[7px] font-black uppercase leading-none ${isSelected ? 'text-white' : 'text-red-700/80'}`}>
                  {lang.code === 'en' ? 'Walk-in' : 'Sin Res.'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ReserveSection = ({ lang, userId, prefillData }: { lang: Language, userId: string | null, prefillData?: { date?: string; time?: string } | null }) => {
  const t = TRANSLATIONS[lang.code];
  const isES = lang.code === 'es';
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [blackouts, setBlackouts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: '2',
    name: '',
    email: '',
    restaurant: 'La Cueva Del Chango'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlackouts = async () => {
       const data = await teableFrontend.list('blackout_periods', { take: 500 });
       if (data) setBlackouts(data.map(r => r.fields));
     };
    fetchBlackouts();
    
    const initialDate = prefillData?.date || format(addDays(new Date(), 1), 'yyyy-MM-dd');
    setFormData(prev => ({ 
      ...prev, 
      date: initialDate,
      time: prefillData?.time || prev.time
    }));
  }, [prefillData]);

  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!formData.date) {
        setTimeSlots([]);
        return;
    }
    const computeSlots = () => {
        try {
          const [y, m, d] = formData.date.split('-').map(Number);
          const resDate = new Date(y, m - 1, d);
          const dayNum = resDate.getDay();
          
          if (dayNum === 0) {
              setTimeSlots([]);
              return;
          }

          let start = 14.5; // La Cueva: Mon-Sat 14:30-21:30 only
          const end = 21.5; 
          
          const slots = [];
          
          // Get "now" in restaurant timezone (Playa del Carmen is EST, GMT-5)
          const nowInRestaurant = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Cancun"}));

          for (let t = start; t <= end; t += 0.5) {
            const h = Math.floor(t);
            const min = (t % 1) === 0.5 ? 30 : 0;
            
            // Check if slot is at least 24 hours away in restaurant time
            const slotDateTime = new Date(y, m - 1, d, h, min);
            const diffMs = slotDateTime.getTime() - nowInRestaurant.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            
            if (diffHours < 24) continue;

            const isBlackedOut = blackouts.some(b => {
                const bDateClean = b.date?.split('T')[0] || b.date;
                if (bDateClean !== formData.date) return false;
                
                const bRest = (b.restaurant || 'La Cueva Del Chango').toLowerCase();
                const rRest = formData.restaurant.toLowerCase();
                if (!bRest.includes(rRest.split(' ')[0]) && !rRest.includes(bRest.split(' ')[0])) {
                    return false;
                }

                const [bh, bm] = b.start_time.split(':').map(Number);
                const [beh, bem] = b.end_time.split(':').map(Number);
                const bStartVal = bh + (bm/60);
                const bEndVal = beh + (bem/60);
                return t >= bStartVal && t < bEndVal;
            });
            if (isBlackedOut) continue;

            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
            slots.push(`${h12}:${min === 30 ? '30' : '00'} ${ampm}`);
          }
          setTimeSlots(slots);
        } catch (e) {
          console.error("Slot computation failed", e);
          setTimeSlots([]);
        }
    };
    computeSlots();
  }, [formData.date, formData.restaurant, blackouts]);

  // Real-time validation
  useEffect(() => {
    if (!formData.date) return;
    const [y, mm, d] = formData.date.split('-').map(Number);
    const resDate = new Date(y, mm - 1, d);
    const dayNum = resDate.getDay();
    const nowInRestaurant = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Cancun"}));
    
    // Check if selecting a future date less than 24 hours away
    const testSlotDateTime = new Date(y, mm - 1, d, 23, 59, 59);
    const diffHours = (testSlotDateTime.getTime() - nowInRestaurant.getTime()) / (1000 * 60 * 60);

    const isHoliday = mm === 12 && (d === 24 || d === 31);

    if (dayNum === 0) {
      setError(lang.code === 'en' 
        ? "We do not take Sunday reservations. Walk-ins only." 
        : "No aceptamos reservas los domingos. Solo clientes sin reserva.");
    } else if (isHoliday) {
      setError(lang.code === 'en'
        ? "We are closed for reservations on December 24th and December 31st."
        : "Estamos cerrados para reservaciones el 24 y 31 de diciembre.");
    } else if (diffHours < 24) {
      setError(lang.code === 'en'
        ? "Reservations less than 24 hours please call directly to Phone +52 (984) 147-0271"
        : "Para reservaciones con menos de 24 horas favor de llamar directamente al teléfono +52 (984) 147-0271");
    } else {
      const partySize = parseInt(formData.guests, 10) || 0;
      if (partySize >= 4 && diffHours < 48) {
        setError(lang.code === 'en'
          ? "Reservations for groups of 4 or more require at least 48 hours notice."
          : "Las reservaciones para grupos de 4 o más personas requieren al menos 48 horas de anticipación.");
      } else {
        setError(null);
      }
    }
  }, [formData.date, formData.guests, lang]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) {
       setError(lang.code === 'en' ? "Please select a time" : "Por favor seleccione una hora");
       return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          restaurant: 'La Cueva Del Chango',
          userId: userId 
        })
      });

      if (response.ok) {
        setStep('success');
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.reservationError);
      }
    } catch (err) {
      setError(t.reservationError);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="pt-24 pb-32 px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4 text-[var(--primary)]">
            {t.reservationSuccess}
          </h2>
          <p className="text-white/60 mb-8">
            {lang.code === 'en' 
              ? "We've received your request and will confirm shortly via email." 
              : "Hemos recibido su solicitud y la confirmaremos pronto por correo electrónico."}
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => {
                const parseTime = (timeStr: string) => {
                  const cleaned = timeStr.trim().toUpperCase();
                  const isPM = cleaned.includes('PM');
                  const isAM = cleaned.includes('AM');
                  const timeOnly = cleaned.replace(/[AMP\s]+/g, '');
                  const parts = timeOnly.split(':');
                  let hours = parseInt(parts[0], 10);
                  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
                  if (isPM && hours < 12) hours += 12;
                  else if (isAM && hours === 12) hours = 0;
                  return { hours, minutes };
                };
                
                const { hours, minutes } = parseTime(formData.time);
                const [y, mon, d] = formData.date.split('-').map(Number);
                
                const startDate = new Date(y, mon - 1, d, hours, minutes);
                const pad = (n: number) => n.toString().padStart(2, '0');
                const start = `${startDate.getFullYear()}${pad(startDate.getMonth() + 1)}${pad(startDate.getDate())}T${pad(startDate.getHours())}${pad(startDate.getMinutes())}00`;
                
                const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
                const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
                
                const title = encodeURIComponent(`La Cueva Del Chango - ${formData.name}`);
                const details = encodeURIComponent(`Reservation for ${formData.guests} guests. See you soon!`);
                const location = encodeURIComponent('La Cueva Del Chango, Calle 38 Norte entre 5ta Avenida y el mar, Playa del Carmen');
                const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
                window.open(url, '_blank');
              }}
              className="w-full py-5 rounded-2xl bg-white/10 border-2 border-white/20 text-[#F8F9FA] font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all shadow-lg"
            >
              <Calendar size={24} className="icon-scaled text-[var(--primary)]" />
              {t.addToCalendar}
            </button>
            <button 
              onClick={() => {
                setStep('form');
                setFormData({ date: '', time: '', guests: '2', name: '', email: '', restaurant: 'La Cueva Del Chango' });
                window.location.href = '/'; // Go back to home
              }}
              className="w-full py-5 rounded-2xl bg-[var(--primary)] text-[var(--primary-beige)] font-black uppercase tracking-widest shadow-xl border-b-4 border-[#8e815a] hover:scale-[1.02] active:scale-95 transition-all"
            >
              {lang.code === 'en' ? 'Done' : 'Finalizar'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 px-4 xs:px-6 text-center max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border border-[var(--primary)]/10 rounded-[48px] p-6 xs:p-10 shadow-lg backdrop-blur-3xl transition-all ${step === 'form' ? 'bg-[var(--bg-glass)]' : 'bg-[var(--bg-glass)]'}`}
      >
        <div className="w-20 h-20 bg-[var(--primary)]/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--primary)]/10">
          <Calendar size={32} className="text-[var(--primary)]" />
        </div>
        <h1 className="text-4xl font-serif font-black mb-2 text-[var(--text-main)] italic tracking-tight" style={{ fontFamily: 'MyriadPro-Regular, sans-serif' }}>
          {t.reserve}
        </h1>
        <p className="text-[var(--primary)] text-[10px] uppercase tracking-[0.4em] font-black mb-10 opacity-60">La Cueva Del Chango � Playa del Carmen</p>
        
        <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-10 text-left">
              <div className="space-y-4">
                <label className="text-[10px] text-[var(--primary)] uppercase font-black tracking-[0.3em] pl-1 drop-shadow-md">
                   {t.date}
                </label>
                <div className="bg-white border border-[var(--primary)]/10 rounded-[32px] p-6 shadow-inner">
                  {/* Month Grid View */}
                  <CalendarView 
                    selectedDate={formData.date}
                    onSelect={(d) => setFormData({...formData, date: d, time: ''})}
                    lang={lang}
                  />
                </div>
                {formData.date && (
                   <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] text-[var(--primary)]/60 italic flex items-center gap-1.5">
                        <Clock size={12} className="text-[var(--primary)]" />
                        {lang.code === 'en' 
                          ? 'Online bookings available up to 1 hour before.' 
                          : 'Reservas online disponibles hasta 1 hora antes.'}
                      </p>
                      <span className="text-[10px] font-black text-[var(--primary-beige)] bg-[var(--primary)] px-3 py-1 rounded-full uppercase tracking-tighter">
                        {(() => {
                          const parts = formData.date.split('-').map(Number);
                          if (parts.length !== 3) return '';
                          return format(new Date(parts[0], parts[1] - 1, parts[2]), 'MMMM d');
                        })()}
                      </span>
                   </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-[var(--primary)] uppercase font-black tracking-[0.3em] pl-1 drop-shadow-md">
                   {t.time}
                </label>
                {!formData.date ? (
                  <div className="py-12 bg-white border border-dashed border-[#065C2F]/10 rounded-[32px] text-center">
                    <p className="text-[#065C2F]/30 text-xs font-bold uppercase tracking-widest italic">
                      {lang.code === 'en' ? 'Select a date first' : 'Primero elige una fecha'}
                    </p>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="py-8 bg-white border border-dashed border-[#065C2F]/20 rounded-[32px] text-center px-6 flex flex-col items-center justify-center gap-3">
                    <p className="text-[#065C2F]/80 text-sm font-bold leading-relaxed">
                       {lang.code === 'en' 
                         ? 'Reservations less than 24 hours please call directly to Phone +52 (984) 147-0271' 
                         : 'Para reservaciones con menos de 24 horas favor de llamar directamente al teléfono +52 (984) 147-0271'}
                    </p>
                    <a 
                      href="tel:+529841470271"
                      className="px-6 py-2.5 bg-[#065C2F] text-[#E8D3A7] rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md"
                    >
                      {lang.code === 'en' ? 'Call Now' : 'Llamar Ahora'}
                    </a>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                      className="w-full bg-white text-[#065C2F] border-2 border-[#065C2F]/20 rounded-[24px] px-6 py-5 text-lg font-black outline-none focus:border-[#065C2F] transition-all shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-[#065C2F]/40 bg-white">
                        {lang.code === 'en' ? 'Choose time slot...' : 'Seleccione un horario...'}
                      </option>
                      {timeSlots.map(s => (
                        <option key={s} value={s} className="text-black bg-white">
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#065C2F]">
                      <ChevronDownIcon size={24} className="icon-scaled" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 text-left">
              <label className="text-[10px] text-[var(--primary)] uppercase font-black tracking-[0.3em] pl-1">{t.guests}</label>
              <div className="relative">
                <select 
                  value={formData.guests}
                  onChange={(e) => setFormData({...formData, guests: e.target.value})}
                  className="w-full bg-white text-[#065C2F] border-2 border-[#065C2F]/20 rounded-[24px] px-6 py-5 text-lg font-black outline-none focus:border-[#065C2F] transition-all shadow-inner appearance-none cursor-pointer"
                >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n.toString()} className="text-black bg-white">{n} {lang.code === 'en' ? 'Guests' : 'Personas'}</option>)}
                      <option value="13+" className="text-black bg-white">{isES ? '13 o más personas' : '13 or more guests'}</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#065C2F]">
                  <ChevronDownIcon size={24} className="icon-scaled" />
                </div>
              </div>
            </div>

            {formData.guests === '13+' ? (
              <div className="space-y-6">
                <div className="space-y-4 text-left">
                  <label className="text-[10px] text-[var(--primary)] uppercase font-black tracking-[0.3em] pl-1">{t.name}</label>
                  <input 
                    placeholder="Andres Garcia"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white text-[var(--text-main)] placeholder:text-[var(--text-main)]/35 border-2 border-[var(--primary)]/10 rounded-[24px] px-6 py-5 text-lg font-bold outline-none focus:border-[var(--primary)] transition-all shadow-inner"
                  />
                </div>
                <div className="p-6 rounded-[24px] border-2 border-red-500/20 bg-red-500/10 text-center space-y-4">
                  <p className="text-sm font-bold text-red-600 leading-relaxed">
                    {isES 
                      ? "Para reservaciones de grupos de 13 o más personas (hasta nuestra capacidad máxima de 100 personas), por favor contáctenos directamente por correo electrónico en info@lacuevadelchango.com."
                      : "For group reservations of 13 or more guests (up to our maximum capacity of 100 people), automated booking is not available. Please contact us directly via email at info@lacuevadelchango.com."}
                  </p>
                  <a
                    href={`mailto:info@lacuevadelchango.com?subject=${encodeURIComponent(isES ? `Reservación de Grupo para ${formData.name || 'Cliente'} - La Cueva Del Chango` : `Group Reservation for ${formData.name || 'Guest'} - La Cueva Del Chango`)}&body=${encodeURIComponent(
                      (isES ? 'Hola equipo de La Cueva Del Chango,\n\nMe gustaría solicitar una reservación para un grupo grande con los siguientes detalles:\n\n' : 'Hello La Cueva Del Chango Team,\n\nI would like to request a large group reservation with the following details:\n\n') +
                      `Nombre / Name: ${formData.name || ''}\n` +
                      `Fecha / Date: ${formData.date || ''}\n` +
                      `Hora / Time: ${formData.time || ''}\n` +
                      `Número de personas / Guest Count: 13+\n\n` +
                      (isES ? 'Por favor confírmenme disponibilidad y los siguientes pasos.\n\nSaludos cordiales,' : 'Please confirm availability and next steps.\n\nBest regards,')
                    )}`}
                    className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-red-600 text-white rounded-[24px] text-lg font-black uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all shadow-xl w-full"
                  >
                    <Mail size={20} className="icon-scaled" />
                    {isES ? 'Enviar Correo de Reservación' : 'Send Reservation Email'}
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                  <div className="space-y-4">
                    <label className="text-[10px] text-[var(--primary)] uppercase font-black tracking-[0.3em] pl-1">{t.name}</label>
                    <input 
                      required
                      placeholder="Andres Garcia"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white text-[var(--text-main)] placeholder:text-[var(--text-main)]/35 border-2 border-[var(--primary)]/10 rounded-[24px] px-6 py-5 text-lg font-bold outline-none focus:border-[var(--primary)] transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] text-[var(--primary)] uppercase font-black tracking-[0.3em] pl-1">{t.email}</label>
                    <input 
                      required
                      type="email" 
                      placeholder="andres@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white text-[var(--text-main)] placeholder:text-[var(--text-main)]/35 border-2 border-[var(--primary)]/10 rounded-[24px] px-6 py-5 text-lg font-bold outline-none focus:border-[var(--primary)] transition-all shadow-inner"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-red-600 text-sm font-bold mt-2 text-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                    {error}
                  </motion.p>
                )}

                <div className="p-6 bg-[var(--primary)]/5 rounded-[32px] border-2 border-dashed border-[var(--primary)]/20 mt-6">
                   <p className="text-[10px] text-[var(--primary)] text-center font-black uppercase tracking-widest leading-relaxed">
                     {t.toleranceMsg}
                   </p>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !!error}
                  className={`w-full py-7 mt-8 rounded-[32px] font-black text-2xl tracking-tight shadow-[0_25px_50px_rgba(0,0,0,0.3)] transition-all ${loading || error ? 'bg-black/10 text-[var(--primary)]/20' : 'bg-[var(--primary)] text-[#E8D3A7] hover:scale-[1.02]'}`}
                >
                  {loading ? 'Processing...' : t.confirmReservation}
                </button>
              </>
            )}
          </form>
        </motion.div>
    </div>
  );
};

const HistorySection = ({ lang }: { lang: Language }) => {
  const text = HISTORY_TEXT[lang.code];
  return (
    <div className="pt-24 pb-32 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl"
      >
        <HistoryIcon className="mx-auto mb-6" size={48} color={COLORS.sandyGold} />
        <h2 className="text-3xl font-serif font-bold mb-6 text-[var(--primary)] text-center">
          {lang.code === 'en' ? 'Our Legacy' : 'Nuestro Legado'}
        </h2>
        <p className="text-white/80 leading-relaxed text-lg italic text-center">
          {text}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <img src="/history-1.png" alt="History 1" className="rounded-2xl shadow-lg" />
          <img src="/history-2.png" alt="History 2" className="rounded-2xl shadow-lg mt-8" />
        </div>
      </motion.div>
    </div>
  );
};


const REVIEW_PLATFORMS = [
  {
    id: 'google',
    name: 'Google',
    emoji: '🌐',
    color: '#4285F4',
    url: 'https://www.google.com/maps/search/La+Cueva+del+Chango+Playa+del+Carmen',
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    emoji: '🦉',
    color: '#34E0A1',
    url: 'https://www.tripadvisor.com/Search?q=La%20Cueva%20del%20Chango%20Playa%20del%20Carmen',
  },
  {
    id: 'yelp',
    name: 'Yelp',
    emoji: '⭐',
    color: '#FF1A1A',
    url: 'https://www.yelp.com/search?find_desc=La+Cueva+del+Chango&find_loc=Playa+del+Carmen',
  },
  {
    id: 'happycow',
    name: 'HappyCow',
    emoji: '🐄',
    color: '#8BC34A',
    url: 'https://www.happycow.net/searchmap?lat=20.635&lng=-87.065&query=La%20Cueva%20del%20Chango',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    emoji: '👍',
    color: '#1877F2',
    url: 'https://www.facebook.com/p/La-Cueva-del-Chango-Restaurante-Bar-100064445959408/',
  },
];

const ReviewsSection = ({ lang }: { lang: Language }) => {
  const isES = lang.code === 'es';
  const [step, setStep] = useState<'rate' | 'private' | 'platforms' | 'done'>('rate');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', review: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (star: number) => {
    setRating(star);
    if (star >= 4) {
      setStep('platforms');
    } else {
      setStep('private');
    }
  };

  const handleSubmitPrivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating, 
          name: form.name, 
          email: form.email, 
          review: form.review, 
          responded: false,
          language: lang.code
        }),
      });
      setStep('done');
    } catch {
      // still show done to user
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  };

  const starLabel = (n: number) => {
    const labels = isES
      ? ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!']
      : ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];
    return labels[n] || '';
  };

  const displayRating = hovered || rating;

  return (
    <div className="pb-32 px-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border border-[var(--primary)]/10 rounded-[32px] p-8 shadow-lg transition-all bg-[var(--bg-glass)] text-[var(--text-main)]`}
      >
        <Star className="mx-auto mb-4" size={40} color="var(--primary)" fill="var(--primary)" />
        <h2 className="text-3xl font-serif font-black mb-2 text-[var(--primary)] text-center" style={{ fontFamily: 'MyriadPro-Regular, sans-serif' }}>
          {isES ? 'Tu Experiencia' : 'Your Experience'}
        </h2>
        <p className="text-[var(--text-main)]/60 text-sm text-center mb-8 italic">
          {isES ? 'Nos importa mucho tu opinión' : 'Your feedback means the world to us'}
        </p>

        {/* ── STEP: RATE ── */}
        {step === 'rate' && (
          <div className="text-center space-y-6">
            <p className="text-[#065C2F]/80 text-sm">
              {isES ? '¿Cómo fue tu visita hoy?' : 'How was your visit today?'}
            </p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  id={`star-${n}`}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => handleStarClick(n)}
                  className="transition-transform hover:scale-125 active:scale-110"
                >
                  <Star
                    size={44}
                    color={COLORS.sandyGold}
                    fill={n <= displayRating ? COLORS.sandyGold : 'transparent'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--primary)] font-bold text-sm tracking-wide"
              >
                {starLabel(displayRating)}
              </motion.p>
            )}
          </div>
        )}

        {/* ── STEP: PRIVATE REVIEW FORM (1-3 stars) ── */}
        {step === 'private' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={20} color="var(--primary)" fill={n <= rating ? "var(--primary)" : 'transparent'} strokeWidth={1.5} />
              ))}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-6 text-center">
              <p className="text-amber-800 text-sm leading-relaxed font-bold">
                {isES
                  ? 'Lamentamos que tu experiencia no haya sido perfecta. Por favor cuéntanos qué pasó y nuestro gerente estará en contacto contigo.'
                  : "We're sorry your experience wasn't perfect. Tell us what happened and our manager will be in touch personally."}
              </p>
            </div>
            <form onSubmit={handleSubmitPrivate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest">
                  {isES ? 'Tu nombre' : 'Your name'}
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white border border-[var(--primary)]/10 rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[var(--primary)]/50 font-medium placeholder:text-[var(--text-main)]/30"
                  placeholder={isES ? 'Nombre' : 'Name'}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border border-[var(--primary)]/10 rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[var(--primary)]/50 font-medium placeholder:text-[var(--text-main)]/30"
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest">
                  {isES ? 'Tu comentario' : 'Your feedback'}
                </label>
                <textarea
                  required
                  value={form.review}
                  onChange={e => setForm({ ...form, review: e.target.value })}
                  rows={4}
                  className="w-full bg-white border border-[var(--primary)]/10 rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:border-[var(--primary)]/50 resize-none font-medium placeholder:text-[var(--text-main)]/30"
                  placeholder={isES ? 'Cuéntanos qué pasó...' : 'Tell us what happened...'}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[var(--primary)] text-[#E8D3A7] font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {submitting ? '...' : isES ? 'Enviar comentario' : 'Send feedback'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('rate'); setRating(0); }}
                className="w-full text-[var(--primary)]/60 hover:text-[var(--primary)] text-sm underline mt-2"
              >
                {isES ? 'Cambiar calificación' : 'Change rating'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── STEP: PLATFORM PICKER (4-5 stars) ── */}
        {step === 'platforms' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={20} color={COLORS.sandyGold} fill={n <= rating ? COLORS.sandyGold : 'transparent'} strokeWidth={1.5} />
              ))}
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 text-center">
              <p className="text-emerald-300 text-sm leading-relaxed">
                {isES
                  ? '¡Genial! ¿Nos ayudarías compartiendo tu experiencia en una de estas plataformas?'
                  : "Wonderful! Would you help us by sharing your experience on one of these platforms?"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {REVIEW_PLATFORMS.map(platform => (
                <a
                  key={platform.id}
                  id={`review-${platform.id}`}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--primary)]/15 rounded-2xl px-5 py-4 hover:bg-[var(--primary)]/5 hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                  <span className="text-2xl">{platform.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-main)] text-sm">{platform.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                      {isES ? 'Dejar reseña' : 'Leave a review'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platform.color }} />
                </a>
              ))}
            </div>
            <button
              onClick={() => { setStep('rate'); setRating(0); }}
              className="w-full text-[var(--text-muted)] text-sm underline mt-6"
            >
              {isES ? 'Cambiar calificación' : 'Change rating'}
            </button>
          </motion.div>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[var(--primary)] mb-3">
              {isES ? '¡Gracias!' : 'Thank you!'}
            </h3>
            <p className="text-[var(--text-muted)] text-sm mb-8 font-bold">
              {isES
                ? 'Gracias por sus comentarios. Nos pondremos en contacto con usted por correo electrónico.'
                : 'Thank you for your feedback. We will contact you via email.'}
            </p>
            <button
              onClick={() => { setStep('rate'); setRating(0); setForm({ name: '', email: '', review: '' }); }}
              className="w-full py-4 bg-[var(--bg-surface)] border border-[var(--primary)]/15 text-[var(--text-muted)] font-bold rounded-2xl hover:bg-[var(--primary)]/5 transition-all"
            >
              {isES ? 'Enviar otra' : 'Submit another'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

const LandingPage = ({ onSelect }: { onSelect: (l: Language) => void }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[var(--primary-beige)] flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-12 w-full max-w-sm bg-black/60 border border-white/10 rounded-[40px] p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="space-y-4 flex flex-col items-center">
          <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-full object-cover border border-white/20 mb-2 shadow-lg" />
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl font-serif font-black text-white tracking-tight"
            style={{ fontFamily: 'MyriadPro-Regular, sans-serif' }}
          >
            LA CUEVA <span style={{ color: '#E8D3A7' }}>DEL CHANGO</span>
          </motion.h1>
          <div className="h-px w-20 bg-[var(--primary)]/30 mx-auto mt-2" />
          <p className="text-white/40 uppercase tracking-[0.4em] font-black text-[9px] mt-1">Auténtica comida mexicana · Playa del Carmen</p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => onSelect(l)}
              className="group relative flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 hover:border-[var(--primary)]/40 transition-all overflow-hidden"
            >
              <div className="flex items-center gap-5">
                <span className="text-4xl filter drop-shadow-lg">{l.flag}</span>
                <div className="text-left">
                  <p className="text-white font-bold text-xl leading-tight">{l.name}</p>
                  <p className="text-[10px] text-[var(--primary)]/40 uppercase tracking-widest font-black mt-1">Continue in {l.name}</p>
                </div>
              </div>
              <Plus size={18} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          ))}
        </div>

        <p className="text-white/10 text-[8px] uppercase tracking-widest font-bold">Playa del Carmen • Mexico</p>
      </motion.div>
    </div>
  );
};

const FacturaSection = ({ lang, userId }: { lang: Language, userId: string | null }) => {
  const [formData, setFormData] = useState({ 
    rfc: '', 
    email: '', 
    fullName: '', 
    phone: '', 
    postalCode: '', 
    cfdiUsage: 'G03 - Gastos en general', 
    ticketUrl: '', 
    voucherUrl: '' 
  });
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);

  const t = {
    title: lang.code === 'en' ? 'Tax Invoice' : 'Facturación Fiscal',
    subtitle: lang.code === 'en' ? 'Official Invoicing (SAT Mexico)' : 'Facturación Oficial (SAT México)',
    rfc: 'RFC (Tax ID)',
    fullName: lang.code === 'en' ? 'Full Name / Razón Social' : 'Nombre Completo / Razón Social',
    email: 'Email',
    phone: lang.code === 'en' ? 'Phone' : 'Teléfono',
    postalCode: lang.code === 'en' ? 'Postal Code' : 'Código Postal',
    usage: lang.code === 'en' ? 'CFDI Usage' : 'Uso de CFDI',
    ticket: lang.code === 'en' ? 'Receipt Photo' : 'Foto del Ticket',
    voucher: lang.code === 'en' ? 'Proof of Payment' : 'Comprobante de Pago',
    submit: lang.code === 'en' ? 'Request Factura' : 'Solicitar Factura',
    successMsg: lang.code === 'en' ? 'Request Received!' : '¡Solicitud Recibida!',
    successSub: lang.code === 'en' ? 'We will email your PDF/XML within 48 hours.' : 'Enviaremos su PDF/XML por correo en 48 horas.'
  };

  const cfdiOptions = [
    'G03 - Gastos en general',
    'P01 - Por definir',
    'S01 - Sin efectos fiscales',
    'D01 - Honorarios médicos',
    'D04 - Donativos'
  ];

  const getBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let ticketBase64 = '';
      let voucherBase64 = '';
      let ticketExt = '';
      let voucherExt = '';

      if (ticketFile) {
        ticketBase64 = await getBase64(ticketFile);
        ticketExt = ticketFile.name.split('.').pop() || 'jpg';
      }
      if (voucherFile) {
        voucherBase64 = await getBase64(voucherFile);
        voucherExt = voucherFile.name.split('.').pop() || 'jpg';
      }

      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ticketBase64, voucherBase64, ticketExt, voucherExt, phone: formData.phone, postalCode: formData.postalCode })
      });
      if (res.ok) {
        setStep('success');
      } else {
        // Safely parse error — server may return JSON or HTML depending on the error type
        let errorMsg = `Server error (${res.status})`;
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          } else {
            const text = await res.text();
            console.error('Non-JSON error response:', text);
            errorMsg = `Server error (${res.status}). Please try again or contact support.`;
          }
        } catch (_) { /* ignore parse errors */ }
        alert("Error: " + errorMsg);
      }
    } catch (err) {
      alert("Error: " + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="px-6 text-center space-y-6 py-20 pb-40">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-[var(--primary)]">{t.successMsg}</h2>
        <p className="text-white/60 italic">{t.successSub}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 pb-40 space-y-8 animate-in fade-in slide-in-from-bottom-5 max-w-2xl mx-auto bg-[var(--bg-glass)] rounded-[32px] border border-[var(--primary)]/10 shadow-lg text-[var(--text-main)]">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-black mb-2 text-[var(--primary)]" style={{ fontFamily: 'MyriadPro-Regular, sans-serif' }}>{t.title}</h2>
        <p className="text-[var(--text-main)]/60 italic text-sm">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.rfc}</label>
          <input 
            type="text" 
            required 
            placeholder="ABCD123456XYZ"
            value={formData.rfc} 
            onChange={e => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
            className="w-full bg-white border border-[var(--primary)]/10 rounded-2xl px-5 py-4 text-[var(--text-main)] uppercase font-mono placeholder:text-[var(--text-main)]/30 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.fullName}</label>
          <input 
            type="text" 
            required 
            value={formData.fullName} 
            onChange={e => setFormData({...formData, fullName: e.target.value})}
            className="w-full bg-white border border-[var(--primary)]/10 rounded-2xl px-5 py-4 text-[var(--text-main)] outline-none focus:border-[var(--primary)]/60 transition-colors font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.email}</label>
          <input 
            type="email" 
            required 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full bg-white border border-[var(--primary)]/10 rounded-2xl px-5 py-4 text-[var(--text-main)] outline-none font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.phone}</label>
            <input 
              type="tel" 
              required 
              placeholder="+52 984 231 2982"
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-white border border-[var(--primary)]/10 rounded-2xl px-5 py-4 text-[var(--text-main)] outline-none font-medium placeholder:text-[var(--text-main)]/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.postalCode}</label>
            <input 
              type="text" 
              required 
              placeholder="77710"
              value={formData.postalCode} 
              onChange={e => setFormData({...formData, postalCode: e.target.value})}
              className="w-full bg-white border border-[var(--primary)]/10 rounded-2xl px-5 py-4 text-[var(--text-main)] outline-none font-medium placeholder:text-[var(--text-main)]/30"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.usage}</label>
          <select 
            value={formData.cfdiUsage} 
            onChange={e => setFormData({...formData, cfdiUsage: e.target.value})}
            className="w-full bg-white border border-[var(--primary)]/10 rounded-2xl px-5 py-4 text-[var(--text-main)] outline-none font-medium appearance-none"
          >
            {cfdiOptions.map(o => <option key={o} value={o} className="bg-white text-[var(--text-main)]">{o}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.ticket}</label>
            <label className="w-full flex flex-col items-center justify-center aspect-square bg-white border border-dashed border-[var(--primary)]/20 rounded-2xl cursor-pointer hover:border-[var(--primary)]/40 transition-all">
               <input type="file" accept="image/*" className="hidden" onChange={e => setTicketFile(e.target.files?.[0] || null)} />
               {ticketFile ? <Check size={24} className="text-emerald-500" /> : <Plus size={24} className="text-[var(--primary)]/20" />}
               <span className="text-[9px] text-[var(--primary)]/50 uppercase font-bold mt-2">{ticketFile ? ticketFile.name : 'Photo'}</span>
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest pl-1">{t.voucher}</label>
            <label className="w-full flex flex-col items-center justify-center aspect-square bg-white border border-dashed border-[var(--primary)]/20 rounded-2xl cursor-pointer hover:border-[var(--primary)]/40 transition-all">
               <input type="file" accept="image/*" className="hidden" onChange={e => setVoucherFile(e.target.files?.[0] || null)} />
               {voucherFile ? <Check size={24} className="text-emerald-500" /> : <Plus size={24} className="text-[var(--primary)]/20" />}
               <span className="text-[9px] text-[var(--primary)]/50 uppercase font-bold mt-2">{voucherFile ? voucherFile.name : 'Photo'}</span>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-5 bg-[var(--primary)] text-[#E8D3A7] font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
          {t.submit}
        </button>
      </form>
    </div>
  );
};

const AIVoiceHome = ({ lang, onAction, messages, setMessages, isEmbedded }: { lang: Language, onAction: (action: string, extraData?: any) => void, messages: any[], setMessages: React.Dispatch<React.SetStateAction<any[]>>, isEmbedded?: boolean }) => {
  const t = TRANSLATIONS[lang.code];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false); // Voice response toggle
  const [supportLinks, setSupportLinks] = useState<{wa?:string, fb?:string, sms?:string, phone?:string}>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(`s_${Date.now()}`);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Use API endpoint for security
        const res = await fetch('/api/admin/settings?password=' + encodeURIComponent(''));
        const result = await res.json();
        const data = result.success ? result : null;
        if (data) {
          const formatWa = (val: string) => {
            if (!val) return null;
            if (val.startsWith('http')) return val;
            return `https://wa.me/${val.replace(/\D/g, '')}`;
          };
          const formatSms = (val: string) => {
            if (!val) return null;
            if (val.startsWith('sms:')) return val;
            return `sms:+${val.replace(/\D/g, '')}`;
          };
          const formatPhone = (val: string) => {
             if (!val) return null;
             if (val.startsWith('tel:')) return val;
             return `tel:+${val.replace(/\D/g, '')}`;
          };

          setSupportLinks({
            wa: formatWa(data.whatsapp_number),
            fb: data.messenger_url,
            sms: formatSms(data.sms_number),
            phone: formatPhone(data.sms_number)
          });
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (forcedInput?: string) => {
    const textToSend = forcedInput || input;
    if (!textToSend.trim() || isLoading) return;
    setInput('');
    const userMessage = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    try {
      // Send chat to our API endpoint
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend, 
          sessionId: sessionId.current, 
          language: lang.code,
          history: messages 
        }),
      });
      
      const data = await res.json();
      let reply = data.reply || '';

      if (data.actionTrigger === 'OPEN_RESERVATION_CALENDAR') {
        setTimeout(() => {
          onAction('reserve', { date: data.prefilledDate, time: data.prefilledTime });
        }, 1500);
        reply = lang.code === 'en' ? 'Opening the reservation form...' : 'Abriendo el formulario de reservación...';
      }

      if (!reply.trim()) {
        if (data.error) {
          reply = lang.code === 'en'
            ? `I'm sorry, I'm having trouble connecting to my brain right now. (${data.error})`
            : `Lo siento, estoy teniendo problemas para conectar con mi cerebro. (${data.error})`;
        } else {
          reply = lang.code === 'en' 
            ? "I'm here to help! You can check our menu, make a reservation, upload a ticket for your factura, or ask about our history."
            : "¡Estoy aquí para ayudarte! Puedes ver nuestro menú, hacer una reservación, subir un ticket para tu factura o preguntar sobre nuestra historia.";
        }
      }

      if (reply.includes('<RESERVATION>')) {
         reply = reply.replace(/<RESERVATION>.*?<\/RESERVATION>/s, '').trim();
         if (!reply) {
             reply = lang.code === 'en'
               ? "Your reservation has been confirmed!"
               : "¡Su reservación ha sido confirmada!";
         }
      }

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: reply }] }]);
      if (isVoiceEnabled) speak(reply);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${err.message || 'Connection error.'}` }] }]);
    } finally { setIsLoading(false); }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Simple word signature matching to detect target TTS language
    const lowerText = text.toLowerCase();
    let detectedLang = lang.code === 'en' ? 'en-US' : 'es-MX';
    
    if (/\b(bonjour|merci|oui|s'il|parlez|chat|menu|carte|déjeuner|dîner)\b/.test(lowerText)) {
      detectedLang = 'fr-FR';
    } else if (/\b(guten|tag|ja|bitte|danke|speisekarte|frühstück|abendessen)\b/.test(lowerText)) {
      detectedLang = 'de-DE';
    } else if (/\b(ciao|grazie|sì|prego|per|favore|colazione|pranzo|cena)\b/.test(lowerText)) {
      detectedLang = 'it-IT';
    } else if (/\b(olá|obrigado|sim|por|favor|almoço|jantar|café)\b/.test(lowerText)) {
      detectedLang = 'pt-BR';
    } else if (/\b(si|hola|gracias|favor|menú|desayuno|comida|cena|vegano)\b/.test(lowerText)) {
      detectedLang = 'es-MX';
    } else if (/\b(yes|hello|thank|please|menu|breakfast|lunch|dinner|vegan)\b/.test(lowerText)) {
      detectedLang = 'en-US';
    }
    
    utterance.lang = detectedLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsListening(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    setIsListening(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          setIsListening(false);

          const format = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
          const blob = new Blob(chunks, { type: recorder.mimeType || `audio/${format}` });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const audioBase64 = String(reader.result).split(',')[1] || '';
            if (!audioBase64) {
              console.warn("Voice: failed to read audio blob.");
              return;
            }
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64, format }),
              });
              const data = await res.json();
              const transcript = (data.text || '').trim();
              if (transcript) {
                setInput(transcript);
                setTimeout(() => handleSend(transcript), 300);
              }
            } catch (err) {
              console.error("Voice transcription error:", err);
            }
          };
          reader.readAsDataURL(blob);
        };

        recorder.onerror = () => {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
          setIsListening(false);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
      })
      .catch((err: any) => {
        console.error("Mic access error:", err);
        setIsListening(false);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          alert("Microphone access was denied. Please allow microphone permissions in your browser settings and try again.");
        } else {
          alert("Unable to access the microphone. Please check your browser permissions.");
        }
      });
  };


  const quickActions = [
    { id: 'reserve', label: t.tableReserve, icon: Calendar, action: () => onAction('reserve') },
    { id: 'menu', label: t.menu, icon: MenuIcon, action: () => onAction('menu') },
    { id: 'factura', label: 'Factura', icon: Check, action: () => onAction('factura') },
    { id: 'reviews', label: t.reviewUs, icon: Star, action: () => onAction('reviews') },
  ];

  return (
    <div className={`flex flex-col h-full overflow-hidden pb-4 px-4 max-w-2xl mx-auto w-full gap-4 ${isEmbedded ? 'pt-0' : 'pt-16 sm:pt-20'}`}>
      <div className="flex-1 overflow-hidden flex flex-col bg-[var(--primary-beige)] border border-[var(--primary)]/10 rounded-[40px] shadow-2xl mb-6 relative">
        <div className="p-4 border-b border-[var(--primary)]/10 flex justify-between items-center bg-white/80 px-6 rounded-t-[40px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Sparkles size={20} color="#E8D3A7" />
            </div>
            <div className="flex-1">
              {/* Title uses the same brand font as the header */}
              <h3
                className="text-lg font-black text-[var(--primary)] leading-tight"
                style={{ fontFamily: 'MyriadPro-Regular, Helvetica Neue, sans-serif', letterSpacing: '-0.02em' }}
              >
                LA CUEVA <span style={{ color: '#E8D3A7' }}>DEL CHANGO</span> ASSISTANT
              </h3>
              {/* AI Powered — clearly visible in primary green */}
              <p className="text-[10px] text-[var(--primary)] opacity-70 uppercase tracking-[0.25em] font-bold mt-0.5">AI Powered</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Volume icon — clearly visible */}
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-2 rounded-xl transition-all border ${
                isVoiceEnabled
                  ? 'bg-[var(--primary)] text-[#E8D3A7] border-[var(--primary)]'
                  : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 hover:bg-[var(--primary)]/20'
              }`}
              title={isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
            >
              <Volume2 size={16} />
            </button>
            {/* Clear chat — clearly visible */}
            <button
              onClick={() => setMessages([])}
              className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-all"
              title="Clear Chat"
            >
              <RefreshCw size={15} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar scroll-smooth" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              {/* Large PNG logo as the greeting hero */}
              <img
                src="/cueva-logo512x.png"
                alt="La Cueva Del Chango"
                className="w-40 h-40 object-contain drop-shadow-lg"
              />
              <div className="text-center space-y-1 px-4">
                <p
                  className="text-base font-black text-[var(--primary)] leading-snug"
                  style={{ fontFamily: 'MyriadPro-Regular, Helvetica Neue, Arial, sans-serif' }}
                >
                  {lang.code === 'en'
                    ? 'Welcome to La Cueva Del Chango!'
                    : '¡Bienvenido a La Cueva Del Chango!'}
                </p>
                <p className="text-sm italic text-[var(--primary)]/70">
                  {lang.code === 'en'
                    ? 'Ask me anything — reservations, menu, hours…'
                    : 'Préguntame — reservaciones, menú, horarios…'}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[var(--primary)]/40 pt-1">Calle 38 • Playa del Carmen</p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-3xl text-[16px] shadow-lg ${m.role === 'user' ? 'bg-[var(--primary)] text-white rounded-tr-none font-bold' : 'bg-white/90 text-[var(--primary)] border border-[var(--primary)]/10 rounded-tl-none font-medium leading-relaxed'}`}>
                <div className="whitespace-pre-wrap min-h-[1.25rem]">
                  {m.parts[0].text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part: string, index: number) => {
                    const match = part.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
                    if (match) {
                      return (
                        <a 
                          key={index} 
                          href={match[2]} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[var(--primary)] underline font-bold hover:text-[var(--primary-beige)] transition-colors"
                        >
                          {match[1]}
                        </a>
                      );
                    }
                    return part;
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="bg-white/5 p-4 rounded-3xl animate-pulse border border-white/5"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-[var(--primary)]/40 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-[var(--primary)]/40 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-[var(--primary)]/40 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div></div>}
        </div>

        <div className="p-3 sm:p-4 bg-white/10 border-t border-white/20">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleVoice} 
                className={`shrink-0 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/20'}`}
              >
                <Mic size={18} strokeWidth={2.5} />
              </button>
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={lang.code === 'en' ? "Ask me..." : "Pregúntame..."}
                className="flex-1 min-w-0 bg-white border border-white/20 rounded-xl sm:rounded-2xl px-4 py-3 text-gray-900 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/40 transition-all font-semibold placeholder:text-gray-500"
              />
              <button 
                onClick={() => handleSend()} 
                className="shrink-0 p-2.5 sm:p-3.5 bg-[var(--primary)] text-[var(--primary-beige)] rounded-xl sm:rounded-2xl shadow-xl active:scale-90 transition-all hover:scale-105"
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={action.action}
            className="flex items-center gap-3 p-4 bg-[var(--primary)] rounded-[28px] hover:brightness-110 transition-all group active:scale-95 shadow-lg border border-[var(--primary)]/10"
          >
            <div className="p-2.5 bg-black/25 rounded-2xl">
              <action.icon size={18} className="text-[#E8D3A7]" strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#E8D3A7] py-1">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="w-full shrink-0 flex items-center justify-center gap-4 pt-1">
          {[
            { id: 'wa', icon: MessageCircle, color: '#25D366', url: supportLinks.wa },
            { id: 'fb', icon: MessageSquare, color: '#0668E1', url: supportLinks.fb },
            { id: 'sms', icon: Smartphone, color: 'var(--primary)', url: supportLinks.sms, showMobileOnly: true },
            { id: 'phone', icon: Phone, color: 'var(--primary)', url: supportLinks.phone, showMobileOnly: true }
          ].filter(c => c.url && (!c.showMobileOnly || isMobile)).map(c => (
            <a 
              key={c.id} 
              href={c.url} 
              target="_blank" 
              className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-transform active:scale-95"
            >
              <c.icon size={18} style={{ color: c.color }} />
            </a>
          ))}
      </div>
    </div>
  );
};

// --- Main App ---

const InstallBanner = ({ lang }: { lang: Language }) => {
  const [show, setShow] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const t = TRANSLATIONS[lang.code];
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const dismissed = localStorage.getItem('lacueva_install_dismissed_v4');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const handleBeforeInstallPrompt = (e: any) => {
      // Only prevent default and show banner if we are on mobile to avoid desktop console noise
      if (isMobile) {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Initial check for non-installed users ON MOBILE ONLY
    if (!isInstalled && !dismissed && isMobile) {
      const timer = setTimeout(() => {
        if (!deferredPrompt) setShow(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShow(false);
          localStorage.setItem('lacueva_install_dismissed_v4', 'true');
        }
      } catch (err) {
        console.error("Installation Prompt error:", err);
        setShowInstructions(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  if (!show) return null;

  return (
    <>
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-[74px] left-4 right-4 z-[150] bg-[var(--primary)] rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-white/20"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-[var(--primary-beige)] p-2 rounded-xl shrink-0">
            <Download size={20} color="var(--primary)" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[var(--primary-beige)] font-bold text-sm truncate">{t.installApp}</p>
            <p className="text-[var(--primary-beige)]/60 text-[9px] font-medium leading-tight">Install for easy bookings & loyalty access</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-[var(--primary-beige)] text-[var(--primary)] text-[10px] font-bold rounded-xl whitespace-nowrap shadow-md active:scale-95 transition-all"
          >
            {deferredPrompt ? (lang.code === 'en' ? 'Install App' : 'Instalar') : t.installationInstructions}
          </button>
          <button 
            onClick={() => { setShow(false); localStorage.setItem('lacueva_install_dismissed_v4', 'true'); }}
            className="p-1 px-2 text-[var(--primary-beige)]/60 hover:text-[var(--primary-beige)]"
          >
            <X size={20} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--primary-beige)] border border-white/10 rounded-[40px] p-8 max-w-sm w-full text-center relative"
            >
              <button onClick={() => setShowInstructions(false)} className="absolute right-6 top-6 text-white/30"><X size={24} /></button>
              <div className="w-16 h-16 bg-[var(--primary)]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Download size={32} color={COLORS.sandyGold} />
              </div>
              <h3 className="text-xl font-serif font-bold text-[var(--primary)] mb-4">{t.installationInstructions}</h3>
              <div className="space-y-4 text-left">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-white/80 font-bold mb-1">Apple iOS (Safari)</p>
                  <p className="text-[10px] text-white/40">{t.iosInstallSteps}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-white/80 font-bold mb-1">Android (Chrome)</p>
                  <p className="text-[10px] text-white/40">{t.androidInstallSteps}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full mt-8 py-4 bg-[var(--primary)] text-[var(--primary-beige)] font-bold rounded-2xl"
              >
                {t.gotIt}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'en') return LANGUAGES[0];
      if (urlLang === 'es') return LANGUAGES[1];
      const saved = localStorage.getItem('lacueva_lang');
      return saved ? JSON.parse(saved) : LANGUAGES[1]; // Default to Spanish (LANGUAGES[1])
    } catch (e) {
      return LANGUAGES[1];
    }
  });

  useEffect(() => {
    localStorage.setItem('lacueva_lang', JSON.stringify(lang));
  }, [lang]);

  const [activeTab, setActiveTab] = useState('home');
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [prefillData, setPrefillData] = useState<{ date?: string; time?: string } | null>(null);

  useEffect(() => {
    const t = TRANSLATIONS[lang.code as keyof typeof TRANSLATIONS];
    document.title = `La Cueva Del Chango - ${t.reserve || 'Restaurant'} | Playa del Carmen`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "La Cueva Del Chango - Luxury Jungle Dining in Playa del Carmen. Reserve your table today.");
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "La Cueva Del Chango - Luxury Jungle Dining in Playa del Carmen. Reserve your table today.";
      document.head.appendChild(meta);
    }
  }, [lang, activeTab]);

  // userId kept for reservation association only (anonymous)
  const [userId] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch (e) {
      setIsEmbedded(true);
    }
  }, []);

  useEffect(() => {
    if (lang) localStorage.setItem('lacueva_lang', JSON.stringify(lang));
  }, [lang]);

  // Login/logout removed — loyalty system deprecated


  // --- Render Diner App ---
// duplicate App definition removed


  try {
    return (
      <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[var(--primary-beige)] text-[var(--text-main)] font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-beige)] relative flex flex-col">
        {/* Background cleaned for better focus */}
        <div className="fixed inset-0 pointer-events-none bg-[var(--primary-beige)]" />
  

      <AnimatePresence>
        {!lang ? (
          <LandingPage onSelect={(l) => { setLang(l); setActiveTab('home'); }} />
        ) : (
          <>
            <Header lang={lang} setLang={setLang} />
            <InstallBanner lang={lang} />

            <main className="relative z-10 flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                  <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    <AIVoiceHome 
                      lang={lang} 
                      messages={aiMessages}
                      setMessages={setAiMessages}
                      isEmbedded={false}
                      onAction={(action, extraData) => {
                        if (action === 'change-lang') setLang(null);
                        else if (action.startsWith('change-lang-direct-')) {
                          const code = action.split('-direct-')[1];
                          const newLang = LANGUAGES.find(l => l.code === code) || LANGUAGES[1];
                          setLang(newLang);
                        }
                        else {
                          if (action === 'reserve' && extraData) {
                            setPrefillData(extraData);
                          }
                          setActiveTab(action);
                        }
                      }} 
                    />
                  </motion.div>
                )}
                {activeTab === 'menu' && (
                  <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-32">
                    <MenuSection lang={lang} />
                  </motion.div>
                )}
                {activeTab === 'reserve' && (
                  <motion.div key="reserve" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-20 pt-32">
                    <ReserveSection lang={lang} userId={userId} prefillData={prefillData} />
                  </motion.div>
                )}
                {activeTab === 'factura' && (
                  <motion.div key="factura" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-20 pt-32">
                    <FacturaSection lang={lang} userId={userId} />
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div key="reviews" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-32">
                    <ReviewsSection lang={lang} />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {!['landing', 'home'].includes(activeTab) && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--primary-beige)] to-transparent z-[60] flex justify-center">
                   <button 
                    onClick={() => setActiveTab('home')} 
                    className="px-12 py-4 bg-[var(--primary)] backdrop-blur-xl border border-[var(--primary)]/10 text-[#E8D3A7] rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:brightness-110 transition-all flex items-center gap-3 active:scale-95"
                   >
                     <ChevronLeft size={16} />
                     {lang.code === 'en' ? 'Start' : 'Inicio'}
                   </button>
                </div>
              )}
            </main>

          </>
        )}
      </AnimatePresence>

        <Analytics />
        <SpeedInsights />
      </div>
    );
  } catch (err) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl max-w-sm text-center">
            <h2 className="text-red-500 font-black mb-4">CRITICAL ERROR</h2>
            <p className="text-white/60 text-xs mb-4">{(err as any).message}</p>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold"
            >
              Reset App (Clear Cache)
            </button>
        </div>
      </div>
    );
  }
};


