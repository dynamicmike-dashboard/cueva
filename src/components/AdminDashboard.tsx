import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode, Users, Calendar as CalendarIcon, Settings, LogOut, Plus, Minus, Shield,
  Trash2, Check, X, Leaf, Clock, RefreshCw, Eye, EyeOff, MessageSquare, Bot, ChevronDown, ChevronUp, Lock, Star,
  FileText, Download
} from 'lucide-react';
import BlackoutPanel from './BlackoutPanel';
import { COLORS, Language, TRANSLATIONS, LANGUAGES } from '../constants';
// import { teableFrontend } from '../../teable-client'; // Not used directly in components
import { 
  format, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  addDays 
} from 'date-fns';
import CalendarSystem from './CalendarSystem';
import ReservationModal from './ReservationModal';

// API helper for admin operations
const apiAdmin = {
  get: async (endpoint: string, password: string) => {
    const res = await fetch(`/api/admin${endpoint}?password=${password}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  post: async (endpoint: string, password: string, data: any) => {
    const res = await fetch(`/api/admin${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, password })
    });
    if (!res.ok) throw new Error('Failed to save');
    return res.json();
  },
  put: async (endpoint: string, password: string, data: any) => {
    const res = await fetch(`/api/admin${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, password })
    });
    if (!res.ok) throw new Error('Failed to update');
    return res.json();
  },
  delete: async (endpoint: string, password: string) => {
    const res = await fetch(`/api/admin${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('Failed to delete');
    return res.json();
  }
};

const DASHBOARD_TRANSLATIONS = {
  en: {
    bookings: "Bookings",
    blackouts: "Blackouts",
    facturas: "Facturas",
    reviews: "Reviews",
    chatLogs: "Chat Logs",
    aiAgent: "AI Agent",
    settings: "Settings",
    activeBookings: "Active Bookings",
    acrossAllVenues: "Across all venues",
    newBooking: "New Booking",
    deleteBlockoutConfirm: "Delete this book-out?",
    deleteBlockoutFailed: "Failed to delete",
    adminPortal: "Admin Portal",
    management: "Management",
    // Settings panel
    adminCredentials: "Admin Credentials",
    newAdminEmail: "New Admin Email",
    newAdminPassword: "New Admin Password",
    leaveBlank: "Leave blank to keep current",
    automatedEmailReminders: "Automated Email Reminders",
    hoursBefore: "h Before",
    reminderMessageTemplate: "Reminder Message Template",
    usePlaceholders: "Use {name} and {time} as placeholders.",
    billingConfig: "Billing Configuration (Factura)",
    legalName: "Legal Name",
    displayName: "Display Name",
    externalSupportLinks: "External Support Links",
    leaveBlankHide: "Leave blank to hide the icon from users.",
    updateSettings: "Update Settings",
    saveSuccess: "Saved successfully",
    saveFailed: "Failed to save",
    // Login
    managementPortal: "Management Portal",
    setNewPassword: "Set New Password",
    enterNewPassword: "Enter a new secure password for your account.",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    cancelBackLogin: "Cancel and Back to Login",
    adminEmail: "Admin Email or Password",
    forgotPassword: "Forgot password?",
    resetEmailSent: "Password reset email sent! Please check your spam folder too.",
    authenticating: "Authenticating...",
    passwordPlaceholder: "Password",
    // Reviews Panel
    feedbackItems: "feedback items",
    inboxEmpty: "Inbox is empty.",
    responded: "Responded",
    pending: "Pending",
    suggestAiReply: "Suggest AI Reply",
    thinkingResponse: "Thinking of a helpful response...",
    replyViaEmail: "Reply via Email",
    // Chat Logs Panel
    chatSessions: "Chat Sessions",
    customerAiLogs: "Customer AI Logs",
    purgeOld: "Purge Old",
    purgeConfirm: "Delete all chat logs older than 7 days?",
    deleteChatConfirm: "Delete this chat session permanently?",
    messages: "messages",
    // Facturas Panel
    facturaRequests: "Factura Requests",
    billingSupport: "Billing Support",
    processed: "Processed",
    markAsDone: "Mark as Done",
    noPendingRequests: "No pending requests",
    cfdiUsage: "Usage (CFDI)",
    viewTicket: "View Ticket",
    viewVoucher: "View Voucher",
    // Bot Trainer Panel
    trainedRules: "trained rules",
    trainNewBehavior: "Train New Behavior",
    correctionOverride: "Correction (Override AI)",
    mandatoryFact: "Mandatory Fact",
    prohibitedResponse: "Prohibited Response",
    keywordsComma: "Keywords (comma separated)",
    trainedResponsePlaceholder: "Trained response...",
    addTrainingRule: "Add Training Rule",
    keywordsLabel: "Keywords",
    deleteRuleConfirm: "Delete this rule?",
    // Contacts Panel
    contacts: "Contacts",
    customerContacts: "Customer Contacts",
    contactName: "Name",
    contactEmail: "Email",
    contactPhone: "Phone",
    contactDate: "Date",
    contactSource: "Source",
    contactDetail: "Details",
    searchContacts: "Search contacts...",
    totalContacts: "total contacts"
  },
  es: {
    bookings: "Reservaciones",
    blackouts: "Bloqueos",
    facturas: "Facturas",
    reviews: "Reseñas",
    chatLogs: "Historial de Chat",
    aiAgent: "Agente IA",
    settings: "Ajustes",
    activeBookings: "Reservas Activas",
    acrossAllVenues: "En todos los restaurantes",
    newBooking: "Nueva Reserva",
    deleteBlockoutConfirm: "¿Eliminar este bloqueo?",
    deleteBlockoutFailed: "Error al eliminar",
    adminPortal: "Portal de Admin",
    management: "Gestión",
    // Settings panel
    adminCredentials: "Credenciales de Admin",
    newAdminEmail: "Nuevo Correo de Admin",
    newAdminPassword: "Nueva Contraseña de Admin",
    leaveBlank: "Dejar en blanco para conservar actual",
    automatedEmailReminders: "Recordatorios de Email Automáticos",
    hoursBefore: "h Antes",
    reminderMessageTemplate: "Plantilla de Mensaje de Recordatorio",
    usePlaceholders: "Usa {name} y {time} como marcadores de posición.",
    billingConfig: "Configuración de Facturación (Factura)",
    legalName: "Nombre / Razón Social",
    displayName: "Nombre Comercial",
    externalSupportLinks: "Enlaces de Soporte Externo",
    leaveBlankHide: "Dejar en blanco para ocultar el icono a los usuarios.",
    updateSettings: "Actualizar Ajustes",
    saveSuccess: "Guardado exitosamente",
    saveFailed: "Error al guardar",
    // Login
    managementPortal: "Portal de Gestión de La Cueva",
    setNewPassword: "Nueva Contraseña",
    enterNewPassword: "Ingrese una nueva contraseña segura para su cuenta.",
    newPassword: "Nueva Contraseña",
    confirmPassword: "Confirmar Contraseña",
    updatePassword: "Actualizar Contraseña",
    cancelBackLogin: "Cancelar y Volver al Inicio",
    adminEmail: "Correo o Contraseña de Admin",
    forgotPassword: "¿Olvidó su contraseña?",
    resetEmailSent: "¡Correo de restablecimiento enviado! Revise su spam también.",
    authenticating: "Autenticando...",
    passwordPlaceholder: "Contraseña",
    // Reviews Panel
    feedbackItems: "comentarios",
    inboxEmpty: "Bandeja de entrada vacía.",
    responded: "Respondido",
    pending: "Pendiente",
    suggestAiReply: "Sugerir respuesta IA",
    thinkingResponse: "Pensando una respuesta útil...",
    replyViaEmail: "Responder por Email",
    // Chat Logs Panel
    chatSessions: "Sesiones de Chat",
    customerAiLogs: "Registros de IA de Clientes",
    purgeOld: "Depurar Antiguos",
    purgeConfirm: "¿Eliminar todos los chats de más de 7 días?",
    deleteChatConfirm: "¿Eliminar esta sesión de chat permanentemente?",
    messages: "mensajes",
    // Facturas Panel
    facturaRequests: "Solicitudes de Factura",
    billingSupport: "Soporte de Facturación",
    processed: "Procesado",
    markAsDone: "Marcar como Terminado",
    noPendingRequests: "Sin solicitudes pendientes",
    cfdiUsage: "Uso (CFDI)",
    viewTicket: "Ver Ticket",
    viewVoucher: "Ver Comprobante",
    // Bot Trainer Panel
    trainedRules: "reglas entrenadas",
    trainNewBehavior: "Entrenar Nuevo Comportamiento",
    correctionOverride: "Corrección (Anular IA)",
    mandatoryFact: "Hecho Obligatorio",
    prohibitedResponse: "Respuesta Prohibida",
    keywordsComma: "Palabras clave (separadas por comas)",
    trainedResponsePlaceholder: "Respuesta entrenada...",
    addTrainingRule: "Agregar Regla de Entrenamiento",
    keywordsLabel: "Palabras clave",
    deleteRuleConfirm: "¿Eliminar esta regla?",
    // Contacts Panel
    contacts: "Contactos",
    customerContacts: "Contactos de Clientes",
    contactName: "Nombre",
    contactEmail: "Email",
    contactPhone: "Teléfono",
    contactDate: "Fecha",
    contactSource: "Origen",
    contactDetail: "Detalles",
    searchContacts: "Buscar contactos...",
    totalContacts: "contactos totales"
  }
};

interface Reward { id: string; title_en: string; title_es: string; points_cost: number; }
interface StaffMember { id: string; name: string; passcode: string; active: boolean; }

// ============================================================
// Sub-panel: QR Scanner for adding points
// ============================================================
// Legacy ScannerPanel removed as loyalty system is deprecated.

// ============================================================
// Sub-panel: Reservations list
// ============================================================
const ReservationsPanel: React.FC<{ 
  lang: Language; 
  password: string; 
  reservations: any[]; 
  blackouts: any[]; 
  loading: boolean;
  onRefresh: () => void;
}> = ({ lang, password, reservations, blackouts, loading, onRefresh }) => {
  const t = TRANSLATIONS[lang.code];
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [activeReservation, setActiveReservation] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Amate' | 'Cueva'>('All');



  return (
    <div className="space-y-4 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 p-4 rounded-2xl border border-white/10 gap-4 mb-4">
        <div className="flex items-center gap-4 px-2">
          <div className="w-14 h-14 bg-[var(--primary)]/20 rounded-2xl flex items-center justify-center text-[var(--primary)] border-2 border-[var(--primary)]/30 shadow-lg">
            <CalendarIcon size={28} className="icon-scaled" />
          </div>
          <div>
            <span className="text-lg text-[#F8F9FA] font-black block">
              {reservations.filter(r => r.date >= new Date().toISOString().split('T')[0]).length} {d.activeBookings}
            </span>
            <span className="text-xs text-white/40 uppercase font-black tracking-[0.2em]">{d.acrossAllVenues}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={() => { setActiveReservation(null); setShowModal(true); }} className="px-6 py-4 bg-[var(--primary)] text-[var(--primary-beige)] rounded-2xl font-black flex-1 sm:flex-none flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-transform">
            <Plus size={24} className="icon-scaled" /> {d.newBooking}
          </button>
          <button onClick={onRefresh} className="p-4 bg-white/10 border-2 border-white/20 rounded-2xl hover:bg-white/20 transition-all text-[var(--primary)] shadow-xl">
            <RefreshCw size={24} className={`icon-scaled ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="h-[600px] flex items-center justify-center bg-black/10 rounded-[32px] border border-white/5">
          <div className="w-10 h-10 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="h-[750px] relative rounded-[40px] overflow-hidden border border-white/10 bg-black/20 shadow-inner">
          <CalendarSystem 
            reservations={reservations} 
            blackouts={blackouts}
            lang={lang.code as 'en' | 'es'} 
            activeFilter={filter}
            onFilterChange={setFilter}
            onSelectEvent={(r) => { setActiveReservation(r); setShowModal(true); }} 
            onSelectBlackout={async (b) => {
              if (window.confirm(lang.code === 'es' ? '¿Eliminar este bloqueo?' : 'Delete this book-out?')) {
                try {
                  const res = await fetch(`/api/admin/blackouts/${b.id}?password=${password}`, { method: 'DELETE' });
                  const data = await res.json();
                  if (data.success) {
                    onRefresh();
                  } else {
                    alert(data.error || 'Failed to delete');
                  }
                } catch (e) {
                  console.error('Delete blackout error:', e);
                }
              }
            }}
          />
        </div>
      )}
      {showModal && (
        <ReservationModal
          reservation={activeReservation}
          onClose={() => setShowModal(false)}
          onRefresh={onRefresh}
          lang={lang.code as 'en' | 'es'}
          staffName="Admin"
          defaultRestaurant={filter === 'All' ? 'La Cueva del Chango' : filter === 'Cueva' ? 'La Cueva del Chango' : 'La Cueva del Chango'}
          password={password}
        />
      )}
    </div>
  );
};

// ============================================================
// Sub-panel: Settings (rewards + codes + staff)
// ============================================================
const SettingsPanel: React.FC<{ lang: Language; password: string; onPasswordChange: (p: string) => void }> = ({ lang, password, onPasswordChange }) => {
  const t = TRANSLATIONS[lang.code];
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [config, setConfig] = useState<{ restaurantCode: string; rewards: Reward[]; reminderTiming?: string; reminderMessage?: string } | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCode, setNewCode] = useState('');
  const [reminderTiming, setReminderTiming] = useState('24h');
  const [reminderMessage, setReminderMessage] = useState('');
  const [newRewardNameEn, setNewRewardNameEn] = useState('');
  const [newRewardNameEs, setNewRewardNameEs] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState(50);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffCode, setNewStaffCode] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [supportMessenger, setSupportMessenger] = useState('');
  const [supportSms, setSupportSms] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [billingName, setBillingName] = useState('');
  const [rfcTaxId, setRfcTaxId] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savMsg, setSavMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const data = await apiAdmin.get('/settings', password);
      if (data.success && data.config) {
        setConfig({
          restaurantCode: data.config.restaurantCode || 'CUEVA2026',
          reminderTiming: data.config.reminderTiming || '24h',
          reminderMessage: data.config.reminderMessage || '',
          supportWhatsapp: data.config.supportWhatsapp || '',
          supportMessenger: data.config.supportMessenger || '',
          supportSms: data.config.supportSms || '',
          supportPhone: data.config.supportPhone || '',
          razonSocial: data.config.razonSocial || '',
          billingName: data.config.billingName || '',
          rfcTaxId: data.config.rfcTaxId || '',
          rewards: []
        });
        setNewCode(data.config.restaurantCode || 'CUEVA2026');
        setReminderTiming(data.config.reminderTiming || '24h');
        setReminderMessage(data.config.reminderMessage || '');
        setSupportWhatsapp(data.config.supportWhatsapp || '');
        setSupportMessenger(data.config.supportMessenger || '');
        setSupportSms(data.config.supportSms || '');
        setSupportPhone(data.config.supportPhone || '');
        setRazonSocial(data.config.razonSocial || '');
        setBillingName(data.config.billingName || '');
        setRfcTaxId(data.config.rfcTaxId || '');
      } else {
        setConfig({ restaurantCode: 'CUEVA2026', rewards: [] } as any);
      }
    } catch {
      setConfig({ restaurantCode: 'CUEVA2026', rewards: [] } as any);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await apiAdmin.get('/staff', password);
      if (data.success) setStaffMembers(data.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchConfig();
    fetchStaff();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavMsg('');
try {
      if (newPassword || newAdminEmail) {
        const payload: any = {};
        if (newPassword) payload.password = newPassword;
        if (newAdminEmail) payload.email = newAdminEmail;
        const res = await fetch('/api/auth/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update user');
        if (newPassword) onPasswordChange(newPassword);
      }

      const data = await apiAdmin.get('/settings', password);
      const existingRow = data.success && data.config ? { id: '1' } : null;

      const updateData = {
        restaurant_code: newCode,
        reminder_timing: reminderTiming,
        reminder_message: reminderMessage,
        whatsapp_number: supportWhatsapp,
        messenger_url: supportMessenger,
        sms_number: supportSms,
        razon_social: razonSocial,
        billing_name: billingName,
        rfc_tax_id: rfcTaxId,
        updated_at: new Date().toISOString()
      };

      let saveError;
      if (existingRow) {
        const res = await apiAdmin.put('/settings', password, updateData);
        if (!res.success) saveError = res.error;
      } else {
        const res = await apiAdmin.post('/settings', password, updateData);
        if (!res.success) saveError = res.error;
      }

      if (saveError) throw saveError;
      setSavMsg('✅ Saved successfully');
      setNewPassword('');
      fetchConfig();
    } catch (error: any) {
      console.error("Save error:", error);
      setSavMsg(`❌ Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const addStaff = async () => {
    if (!newStaffName || !newStaffCode) return;
    await apiAdmin.post('/staff', password, { name: newStaffName, passcode: newStaffCode, active: true });
    setNewStaffName('');
    setNewStaffCode('');
    fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    await apiAdmin.delete(`/staff/${id}`, password);
    fetchStaff();
  };

  if (!config) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Deprecated Loyalty / Staff Code removed */}

      <div className="space-y-4">
        <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest flex items-center gap-2">
          <Shield size={12} /> {d.adminCredentials}
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{d.newAdminEmail}</label>
            <input
              type="email"
              value={newAdminEmail}
              onChange={e => setNewAdminEmail(e.target.value)}
              placeholder={d.leaveBlank}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[var(--primary)]/60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{d.newAdminPassword}</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={d.leaveBlank}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white outline-none focus:border-[var(--primary)]/60"
              />
              <button onClick={() => setShowPw(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Reminders */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest flex items-center gap-2">
          <Clock size={12} /> {t.manageReminders}
        </label>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{t.reminderTiming}</p>
            <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
               <Clock size={12} /> {d.automatedEmailReminders}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setReminderTiming('24h')}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${reminderTiming === '24h' ? 'bg-[var(--primary)] text-[var(--primary-beige)] border-[var(--primary)]' : 'bg-white/5 text-white/40 border-white/10'}`}
              >
                24{d.hoursBefore}
              </button>
              <button 
                onClick={() => setReminderTiming('2h')}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${reminderTiming === '2h' ? 'bg-[var(--primary)] text-[var(--primary-beige)] border-[var(--primary)]' : 'bg-white/5 text-white/40 border-white/10'}`}
              >
                2{d.hoursBefore}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest pl-1">{d.reminderMessageTemplate}</p>
            <textarea 
              value={reminderMessage}
              onChange={e => setReminderMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-[var(--primary)]/60 min-h-[80px] no-scrollbar"
              placeholder="Hi {name}, reminding you of your reservation..."
            />
            <p className="text-[9px] text-white/20 italic">{d.usePlaceholders}</p>
          </div>
        </div>
      </div>

      {/* Rewards Management (Deprecated) */}

      {/* Staff Management */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest flex items-center gap-2">
          <Users size={12} /> {t.manageStaff}
        </label>
        <div className="space-y-2">
          {staffMembers.map(s => (
            <div key={s.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 pr-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{s.name}</p>
                <p className="text-[10px] text-white/40 font-mono tracking-[0.3em]">{t.passcode}: {s.passcode}</p>
              </div>
              <button 
                onClick={() => deleteStaff(s.id)}
                className="p-2 text-red-400/40 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{t.authNewMember}</p>
          <div className="flex gap-2">
            <input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder={t.staffName} className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white flex-1" />
            <input type="text" maxLength={4} value={newStaffCode} onChange={e => setNewStaffCode(e.target.value)} placeholder="1234" className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white w-20 text-center font-mono" />
            <button onClick={addStaff} className="p-2 bg-[var(--primary)] text-[var(--primary-beige)] rounded-xl"><Plus size={20} /></button>
          </div>
        </div>
      </div>

      {/* Billing Config */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest flex items-center gap-2">
          <Check size={12} /> {d.billingConfig}
        </label>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[9px] text-white/40 uppercase font-black">{d.legalName}</p>
            <input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder={d.legalName} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[9px] text-white/40 uppercase font-black">{d.displayName}</p>
              <input type="text" value={billingName} onChange={e => setBillingName(e.target.value)} placeholder={d.displayName} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] text-white/40 uppercase font-black">RFC / Tax ID</p>
              <input type="text" value={rfcTaxId} onChange={e => setRfcTaxId(e.target.value.toUpperCase())} placeholder="RFC" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono" />
            </div>
          </div>
        </div>
      </div>

      {savMsg && (
        <div className={`p-3 rounded-2xl text-sm text-center font-bold ${savMsg.startsWith('✅') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {savMsg}
        </div>
      )}

      {/* Support Channels */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={12} /> {d.externalSupportLinks}
        </label>
        <p className="text-[10px] text-white/30 italic -mt-2">{d.leaveBlankHide}</p>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[9px] text-white/40 uppercase font-black">WhatsApp URL / Hub</p>
            <input type="text" value={supportWhatsapp} onChange={e => setSupportWhatsapp(e.target.value)} placeholder="https://wa.me/..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-white/40 uppercase font-black">Messenger URL</p>
            <input type="text" value={supportMessenger} onChange={e => setSupportMessenger(e.target.value)} placeholder="https://m.me/..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-white/40 uppercase font-black">SMS Number</p>
            <input type="text" value={supportSms} onChange={e => setSupportSms(e.target.value)} placeholder="sms:+52..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-white/40 uppercase font-black">Phone Number</p>
            <input type="text" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} placeholder="tel:+52..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-4 bg-[var(--primary)] text-[var(--primary-beige)] font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
      >
        <RefreshCw size={18} /> {d.updateSettings}
      </button>
    </div>
  );
};

// ============================================================
// Sub-panel: Private reviews inbox (1-3 star)
// ============================================================
const ReviewsPanel: React.FC<{ lang: Language; password: string }> = ({ lang, password }) => {
  const t = TRANSLATIONS[lang.code];
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [replyLang, setReplyLang] = useState<'es' | 'en'>('es');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await apiAdmin.get('/reviews', password);
      if (data) setReviews(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const getAiSuggestion = async (review: any, suggestLanguage: 'es' | 'en') => {
    setActiveReviewId(String(review.id));
    setSuggesting(String(review.id));
    setSuggestion('');
    try {
      const res = await fetch('/api/admin/reviews/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password, 
          reviewText: review.review, 
          customerName: review.name,
          language: suggestLanguage
        })
      });
      const data = await res.json();
      setSuggestion(data.suggestion);
    } catch {
      setSuggestion(lang.code === 'es' ? "Error al generar sugerencia." : "Error generating suggestion.");
    } finally {
      setSuggesting(null);
    }
  };

  const markResponded = async (id: string) => {
    await apiAdmin.put(`/reviews/${id}`, password, { responded: true });
    fetchReviews();
    setActiveReviewId(null);
  };

  const sendEmail = (review: any) => {
    const subject = encodeURIComponent(lang.code === 'es' ? `Mensaje del Gerente de La Cueva del Chango` : `Message from La Cueva del Chango Manager`);
    const body = encodeURIComponent(suggestion);
    window.location.href = `mailto:${review.email}?subject=${subject}&body=${body}`;
    markResponded(review.id);
  };

  useEffect(() => { fetchReviews(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{reviews.length} {d.feedbackItems}</span>
        <button onClick={fetchReviews} className="p-1.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw size={14} color={COLORS.sandyGold} />
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : reviews.filter((r: any) => !r.responded).length === 0 ? (
        <p className="text-center text-white/30 py-8 italic">{d.inboxEmpty}</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
          {reviews.filter((r: any) => !r.responded).map((r, i) => (
            <div key={i} className={`bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 transition-opacity ${r.responded ? 'opacity-40' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white">{r.name}</h4>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Check key={j} size={10} color={j <= r.rating ? COLORS.sandyGold : 'rgba(255,255,255,0.1)'} strokeWidth={3} />
                    ))}
                  </div>
                </div>
                {r.responded ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1">
                    <Check size={10} /> {d.responded}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">{d.pending}</span>
                )}
              </div>
              <p className="text-sm text-[var(--text-main)] leading-relaxed italic pr-2">"{r.review}"</p>
              
              {!r.responded && (
                <div className="pt-2 border-t border-white/5 space-y-3">
                  {String(activeReviewId) === String(r.id) && suggestion ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                      <div className="p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl text-[11px] text-[var(--primary)]/80 leading-relaxed whitespace-pre-wrap">
                        {suggestion}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => sendEmail(r)} className="flex-1 py-2 bg-[var(--primary)] text-[var(--primary-beige)] rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                           {d.replyViaEmail}
                        </button>
                        <button onClick={() => setActiveReviewId(null)} className="p-2 border border-white/10 rounded-xl text-white/40"><X size={16}/></button>
                      </div>
                    </motion.div>
                  ) : String(suggesting) === String(r.id) ? (
                    <div className="flex items-center gap-2 text-[10px] text-[var(--primary)] font-bold animate-pulse py-2">
                      <RefreshCw size={12} className="animate-spin" /> {d.thinkingResponse}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => getAiSuggestion(r, replyLang)}
                        className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest border border-[var(--primary)]/30 px-3 py-1.5 rounded-full hover:bg-[var(--primary)]/10 transition-all flex items-center gap-2"
                      >
                        <MessageSquare size={12} /> {d.suggestAiReply}
                      </button>
                      
                      {/* Language Toggle */}
                      <div className="flex rounded-full border border-[var(--primary)]/30 overflow-hidden text-[9px] font-black uppercase">
                        <button 
                          onClick={() => setReplyLang('es')}
                          className={`px-2.5 py-1 transition-all ${replyLang === 'es' ? 'bg-[var(--primary)] text-[var(--primary-beige)]' : 'bg-transparent text-[var(--primary)] hover:bg-[var(--primary)]/10'}`}
                        >
                          ES
                        </button>
                        <button 
                          onClick={() => setReplyLang('en')}
                          className={`px-2.5 py-1 transition-all ${replyLang === 'en' ? 'bg-[var(--primary)] text-[var(--primary-beige)]' : 'bg-transparent text-[var(--primary)] hover:bg-[var(--primary)]/10'}`}
                        >
                          EN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <p className="text-[10px] text-white/30 truncate max-w-[150px]">{r.email}</p>
                <p className="text-[10px] text-white/20">{new Date(r.created_at || r.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Sub-panel: Chat Logs review
// ============================================================
const ChatLogsPanel: React.FC<{ lang: Language; password: string }> = ({ lang, password }) => {
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/chat-sessions?password=${password}`);
      const data = await res.json();
      if (data.success && data.sessions) {
        setSessions(data.sessions);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/30">
            <MessageSquare size={20} />
          </div>
          <div>
            <span className="text-sm text-[#F8F9FA] font-black block">{sessions.length} {d.chatSessions}</span>
            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{d.customerAiLogs}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (window.confirm(d.purgeConfirm)) {
                await fetch(`/api/admin/chat-logs/purge/old?password=${password}`, { method: 'DELETE' });
                fetchLogs();
              }
            }}
            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2"
          >
            <Trash2 size={14} /> {d.purgeOld}
          </button>
          <button onClick={fetchLogs} className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all text-[var(--primary)]">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : sessions.length === 0 ? (
        <p className="text-center text-white/30 py-8 italic">{lang.code === 'es' ? 'Sin registros de chat aún' : 'No chat logs yet'}</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
          {sessions.map((session: any) => (
            <div key={session.session_id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedSession(expandedSession === session.session_id ? null : session.session_id)}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Bot size={14} color={COLORS.sandyGold} />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-main)]">{session.session_id.substring(0, 16)}...</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{session.message_count} {d.messages} · {new Date(session.last_message).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(d.deleteChatConfirm)) {
                        await fetch(`/api/admin/chat-logs/${session.session_id}?password=${password}`, { method: 'DELETE' });
                        fetchLogs();
                      }
                    }}
                    className="p-2 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedSession === session.session_id
                    ? <ChevronUp size={18} className="text-[var(--primary)]" />
                    : <ChevronDown size={18} className="text-white/40" />}
                </div>
              </button>

              {expandedSession === session.session_id && (
                <div className="px-3 pb-3 space-y-2 border-t border-white/5">
                  {(session.messages || []).map((msg: any, i: number) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[var(--primary)]/20 text-[var(--primary)] rounded-br-sm'
                          : 'bg-white/10 text-[var(--text-main)] rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Sub-panel: Facturas (Invoice requests)
// ============================================================
const FacturasPanel: React.FC<{ lang: Language; password: string }> = ({ lang, password }) => {
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFacturas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/facturas?password=${password}`);
      const data = await res.json();
      if (data.success) setFacturas(data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const markDone = async (id: string) => {
    await fetch(`/api/admin/facturas/${id}/done`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    fetchFacturas();
  };

  useEffect(() => { fetchFacturas(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/30">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-sm text-[#F8F9FA] font-black block">{facturas.length} {d.facturaRequests}</span>
            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{d.billingSupport}</span>
          </div>
        </div>
        <button onClick={fetchFacturas} className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all text-[var(--primary)]">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : facturas.length === 0 ? (
        <p className="text-center text-white/30 py-8 italic">{d.noPendingRequests}</p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 no-scrollbar pb-10">
          {facturas.map((f, i) => (
            <div key={i} className={`bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 transition-all ${f.status === 'done' ? 'opacity-40' : 'opacity-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[var(--primary)] text-xl">{f.full_name}</h4>
                  <p className="text-sm text-white/40 font-mono tracking-widest uppercase">{f.rfc}</p>
                </div>
                {f.status === 'done' ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">{d.processed}</span>
                ) : (
                  <button 
                    onClick={() => markDone(f.id)}
                    className="text-[11px] bg-[var(--primary)] text-[var(--primary-beige)] px-4 py-2 rounded-full font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    {d.markAsDone}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                  <p className="text-[11px] text-[var(--text-muted)] uppercase font-black tracking-widest">Email</p>
                  <p className="text-sm text-[var(--text-main)] truncate">{f.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-[var(--text-muted)] uppercase font-black tracking-widest">{d.cfdiUsage}</p>
                  <p className="text-sm text-[var(--text-main)]">{f.cfdi_usage}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {f.ticket_url && (
                  <a href={f.ticket_url} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <Download size={14} /> {d.viewTicket}
                  </a>
                )}
                {f.voucher_url && (
                  <a href={f.voucher_url} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <Download size={14} /> {d.viewVoucher}
                  </a>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                 <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold">{new Date(f.created_at).toLocaleString()}</p>
                 <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold">{f.postal_code} • {f.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Sub-panel: Chatbot Training Rules
// ============================================================
const BotTrainerPanel: React.FC<{ lang: Language; password: string }> = ({ lang, password }) => {
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [newRule, setNewRule] = useState({ rule_type: 'correction', trigger_keywords: '', response_text: '', active: true });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await apiAdmin.get('/chatbot-rules', password);
      if (data) setRules(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rule: any) => {
    if (!rule.trigger_keywords || !rule.response_text) return;
    try {
      await apiAdmin.post('/chatbot-rules', password, { rule_type: rule.rule_type, trigger_keywords: rule.trigger_keywords, response_text: rule.response_text, active: rule.active ?? true });
      setNewRule({ rule_type: 'fact', trigger_keywords: '', response_text: '' });
      fetchRules();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(d.deleteRuleConfirm)) {
      await apiAdmin.delete(`/chatbot-rules/${id}`, password);
      fetchRules();
    }
  };

  useEffect(() => { fetchRules(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{rules.length} {d.trainedRules}</span>
        <button onClick={fetchRules} className="p-1.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw size={14} color={COLORS.sandyGold} />
        </button>
      </div>

      {/* Add New Rule */}
      <div className="bg-[var(--primary)]/5 border border-dashed border-[var(--primary)]/20 rounded-2xl p-4 space-y-3">
        <p className="text-[10px] text-[var(--primary)] uppercase font-bold tracking-widest">{d.trainNewBehavior}</p>
        <select 
          value={newRule.rule_type}
          onChange={e => setNewRule({...newRule, rule_type: e.target.value})}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
        >
          <option value="correction" className="bg-[var(--primary-beige)]">{d.correctionOverride}</option>
          <option value="fact" className="bg-[var(--primary-beige)]">{d.mandatoryFact}</option>
          <option value="ban" className="bg-[var(--primary-beige)]">{d.prohibitedResponse}</option>
        </select>
        <input 
          placeholder={d.keywordsComma}
          value={newRule.trigger_keywords}
          onChange={e => setNewRule({...newRule, trigger_keywords: e.target.value})}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
        />
        <textarea 
          placeholder={d.trainedResponsePlaceholder}
          value={newRule.response_text}
          onChange={e => setNewRule({...newRule, response_text: e.target.value})}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white min-h-[60px]"
        />
        <button onClick={() => handleSave(newRule)} className="w-full py-2 bg-[var(--primary)] text-[var(--primary-beige)] rounded-xl font-bold text-xs uppercase">{d.addTrainingRule}</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
          {rules.map((rule: any) => (
            <div key={rule.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 relative group">
              <div className="flex justify-between items-start pr-8">
                <div>
                  <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${rule.rule_type === 'correction' ? 'bg-amber-500/20 text-amber-500' : rule.rule_type === 'fact' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                    {rule.rule_type === 'correction' ? d.correctionOverride : rule.rule_type === 'fact' ? d.mandatoryFact : d.prohibitedResponse}
                  </span>
                  <p className="text-xs text-[var(--primary)] font-bold mt-2">{d.keywordsLabel}: {rule.trigger_keywords}</p>
                </div>
                <button onClick={() => handleDelete(rule.id)} className="absolute top-4 right-4 p-2 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-white/90 leading-relaxed italic mt-2">"{rule.response_text}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
// ============================================================
// Sub-panel: Customer Contacts
// ============================================================
const ContactsPanel: React.FC<{ lang: Language; password: string }> = ({ lang, password }) => {
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteContact = async (id: string, table: string) => {
    if (!window.confirm(lang.code === 'es' ? `¿Eliminar este contacto de ${table}?` : `Delete this contact from ${table}?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/contacts?id=${id}&table=${table}&password=${password}`, { method: 'DELETE' });
      fetchContacts();
    } catch {} finally {
      setDeleting(null);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contacts?password=${password}`);
      const data = await res.json();
      if (data.success) setContacts(data.contacts || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtered = contacts.filter(c =>
    !search || [c.name, c.email, c.phone, c.date, c.source, c.detail].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = (a[sortField] || '').toLowerCase();
    const bVal = (b[sortField] || '').toLowerCase();
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="opacity-20 ml-1">⇅</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/30">
            <Users size={20} />
          </div>
          <div>
            <span className="text-sm text-[#F8F9FA] font-black block">{contacts.length} {d.totalContacts}</span>
            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{d.customerContacts}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={d.searchContacts}
            className="flex-1 sm:w-48 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-[var(--primary)]/60"
          />
          <button onClick={fetchContacts} className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all text-[var(--primary)]">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-white/30 py-8 italic">{lang.code === 'es' ? 'Sin contactos aún' : 'No contacts yet'}</p>
      ) : (
        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th onClick={() => handleSort('name')} className="p-3 font-black uppercase tracking-widest text-[var(--primary)] cursor-pointer hover:bg-white/5 whitespace-nowrap">{d.contactName}<SortIcon field="name" /></th>
                <th onClick={() => handleSort('email')} className="p-3 font-black uppercase tracking-widest text-[var(--primary)] cursor-pointer hover:bg-white/5 whitespace-nowrap">{d.contactEmail}<SortIcon field="email" /></th>
                <th onClick={() => handleSort('phone')} className="p-3 font-black uppercase tracking-widest text-[var(--primary)] cursor-pointer hover:bg-white/5 whitespace-nowrap">{d.contactPhone}<SortIcon field="phone" /></th>
                <th onClick={() => handleSort('date')} className="p-3 font-black uppercase tracking-widest text-[var(--primary)] cursor-pointer hover:bg-white/5 whitespace-nowrap">{d.contactDate}<SortIcon field="date" /></th>
                <th onClick={() => handleSort('source')} className="p-3 font-black uppercase tracking-widest text-[var(--primary)] cursor-pointer hover:bg-white/5 whitespace-nowrap">{d.contactSource}<SortIcon field="source" /></th>
                <th className="p-3 font-black uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap">{d.contactDetail}</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-white">{c.name}</td>
                  <td className="p-3 text-white/70">{c.email}</td>
                  <td className="p-3 text-white/70 font-mono">{c.phone}</td>
                  <td className="p-3 text-white/70 whitespace-nowrap">{c.date}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${c.source === 'Reservation' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {c.source}
                    </span>
                  </td>
                  <td className="p-3 text-white/50 text-[10px]">{c.detail}</td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteContact(c.id, c.table)}
                      disabled={deleting === c.id}
                      className="p-1.5 text-white/20 hover:text-red-400 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC<{ lang: Language; setLang?: (l: Language) => void }> = ({ lang, setLang }) => {
  const t = TRANSLATIONS[lang.code];
  const d = DASHBOARD_TRANSLATIONS[lang.code as 'en' | 'es'] || DASHBOARD_TRANSLATIONS.es;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [newAuthPassword, setNewAuthPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [view, setView] = useState<'reservations' | 'blackout' | 'facturas' | 'reviews' | 'chat' | 'training' | 'settings' | 'contacts'>('reservations');
  
  const [reservations, setReservations] = useState<any[]>([]);
  const [blackouts, setBlackouts] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const res = await fetch(`/api/admin/reservations?password=${apiPassword}`);
      const resData = await res.json();
      if (resData.success) setReservations(resData.data || []);
      
      const bRes = await fetch(`/api/admin/blackouts?password=${apiPassword}`);
      const bData = await bRes.json();
      if (bData.success) setBlackouts(bData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      console.log("[Auth] Auth link check:", { hash: hash ? "Present" : "Empty", search: search ? "Present" : "Empty" });
      
      if (
        hash.includes('type=recovery') || hash.includes('recovery') || hash.includes('access_token') ||
        search.includes('type=recovery') || search.includes('recovery')
      ) {
        console.log("[Auth] Recovery/Auth link detected");
        setIsRecovering(true);
      }
    };

    // 1. Initial check
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    // 2. Check initial session on mount
const initAuth = () => {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          const session = data.session;
          if (session) {
            console.log("[Auth] Initial session found for:", session.user?.email);
            return fetch(`/api/admin/restaurant-secrets?password=${apiPassword}`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.data?.admin_password) {
                  setApiPassword(data.data.admin_password);
                  setIsLoggedIn(true);
                } else {
                  console.warn("[Auth] Session exists but restaurant_secrets (admin_password) not found. Dashboard remains locked.");
                }
              });
          }  // Added missing closing parenthesis for the first .then()
        })
        .catch(e => {
          console.error("Initial session check failed:", e);
        });
initAuth();
    };

    // 3. Listen for auth state changes - replaced with manual session check
    // The auth state is now managed via API calls
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const tabs = [
    { id: 'reservations', label: d.bookings, icon: CalendarIcon },
    { id: 'blackout', label: d.blackouts, icon: Lock },
    { id: 'facturas', label: d.facturas, icon: FileText },
    { id: 'reviews', label: d.reviews, icon: Star },
    { id: 'chat', label: d.chatLogs, icon: MessageSquare },
    { id: 'contacts', label: d.contacts, icon: Users },
    { id: 'training', label: d.aiAgent, icon: Bot },
    { id: 'settings', label: d.settings, icon: Settings }
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Verify credentials with server
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: email.toLowerCase().includes('@') ? email : password })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }
      
      // Use the entered password/email for subsequent API calls
      setApiPassword(email.toLowerCase().includes('@') ? email : password);
      setIsLoggedIn(true);
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Enter your email first');
      return;
    }
    setIsLoading(true);
    setError('');
    setResetMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: window.location.origin + '/admin.html' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setResetMsg('Password reset email sent! Please check your spam folder too.');
    } catch (err: any) {
      console.error("[Auth] Reset error:", err);
      setError(`Reset failed: ${err.message}. Ensure your email is registered and the domain is authorized.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newAuthPassword || newAuthPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newAuthPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newAuthPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setResetMsg('✅ Password updated successfully! You can now log in.');
      setIsRecovering(false);
      setNewAuthPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(`Update failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="pt-24 pb-32 px-6 bg-[#043d1f] min-h-screen admin-theme">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-[40px] p-8 shadow-2xl max-w-md mx-auto"
        >
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Leaf size={32} color={COLORS.sandyGold} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--primary)] text-center mb-2">{d.adminPortal}</h2>
          <p className="text-white/30 text-xs text-center mb-8 italic">La Cueva del Chango · {d.managementPortal}</p>

          <div className="space-y-4">
            {isRecovering ? (
              <>
                <h3 className="text-[var(--primary)] font-bold text-center mb-2">{d.setNewPassword}</h3>
                <p className="text-white/40 text-[10px] text-center mb-6">{d.enterNewPassword}</p>
                <input
                  type="password"
                  value={newAuthPassword}
                  onChange={e => setNewAuthPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[var(--primary)]/60 transition-colors"
                  placeholder={d.newPassword}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[var(--primary)]/60 transition-colors"
                  placeholder={d.confirmPassword}
                />
                {error && <p className="text-red-400 text-[10px] text-center bg-red-500/10 p-2 rounded-xl">{error}</p>}
                <button 
                  onClick={handleUpdatePassword} 
                  disabled={isLoading} 
                  className="w-full py-4 bg-[var(--primary)] text-[var(--primary-beige)] font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {isLoading ? (lang.code === 'es' ? 'Actualizando...' : 'Updating...') : d.updatePassword}
                </button>
                <button onClick={() => setIsRecovering(false)} className="w-full text-[10px] text-white/40 hover:text-white transition-colors mt-2">
                  {d.cancelBackLogin}
                </button>
              </>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:border-[var(--primary)]/60 transition-colors"
                  placeholder={d.adminEmail}
                />
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 pr-12 text-white outline-none focus:border-[var(--primary)]/60 transition-colors"
                    placeholder={t.password || d.passwordPlaceholder}
                  />
                  <button onClick={() => setShowPw(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <p className="text-red-400 text-[10px] text-center bg-red-500/10 p-2 rounded-xl">{error}</p>}
                {resetMsg && <p className="text-emerald-400 text-[10px] text-center bg-emerald-500/10 p-2 rounded-xl">{resetMsg}</p>}
                <button 
                  onClick={handleLogin} 
                  disabled={isLoading} 
                  className="w-full py-4 bg-[var(--primary)] text-[var(--primary-beige)] font-black rounded-2xl shadow-[0_20px_40px_rgba(194, 178, 128,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {isLoading ? d.authenticating : t.login}
                </button>
                <div className="text-center pt-2">
                  <button onClick={handleResetPassword} disabled={isLoading} className="text-[10px] text-white/40 hover:text-white transition-colors">
                    {d.forgotPassword}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-2 sm:pt-10 pb-40 px-2 sm:px-6 md:px-12 bg-[var(--primary-beige)] min-h-screen text-[var(--text-main)] overflow-x-hidden admin-theme">
      <div className="glass-panel-heavy rounded-[24px] sm:rounded-[48px] p-4 sm:p-dashboard shadow-2xl max-w-6xl mx-auto border border-[#065C2F]/15">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-12 pb-4 sm:pb-8 border-b-2 border-[#065C2F]/10 gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
             <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[#065C2F]/10 rounded-xl sm:rounded-3xl flex items-center justify-center text-[#065C2F] border-2 border-[#065C2F]/20 shrink-0">
                <Leaf size={20} className="sm:size-32 icon-scaled" />
             </div>
             <div>
               <h2 className="text-lg sm:text-4xl font-serif font-black text-[#065C2F] tracking-tight">{d.adminPortal}</h2>
               <p className="text-[8px] sm:text-xs text-[#065C2F]/50 uppercase font-black tracking-[0.4em] mt-0.5">{d.management}</p>
             </div>
          </div>
<button 
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                setIsLoggedIn(false);
                setApiPassword('');
              }} 
              className="p-3 sm:p-4 bg-red-500/10 border-2 border-red-500/20 text-red-500 rounded-xl sm:rounded-2xl hover:bg-red-500/20 transition-all shadow-md group w-full md:w-auto flex justify-center"
            >
              <LogOut size={20} className="icon-scaled group-hover:rotate-12 transition-transform" />
           </button>
           <select
             value={lang.code}
             onChange={(e) => {
               const newCode = e.target.value as keyof typeof TRANSLATIONS;
               const newLang = LANGUAGES.find(l => l.code === newCode) || LANGUAGES[1];
               if (setLang) {
                 setLang(newLang);
               } else {
                 window.location.search = `?lang=${newCode}`;
               }
             }}
             className="ml-4 p-2 bg-white/5 border border-white/10 rounded-xl text-white bg-neutral-800"
           >
             {Object.keys(TRANSLATIONS).map((code) => (
               <option key={code} value={code}>
                 {TRANSLATIONS[code as any].languageName || code.toUpperCase()}
               </option>
             ))}
           </select>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-6 mb-8 border-b border-[#065C2F]/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={`flex items-center gap-2 sm:gap-4 px-3 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-sm uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                  isActive 
                    ? 'bg-[#065C2F] text-[#E8D3A7] border-[#065C2F] shadow-lg scale-105' 
                    : 'bg-black/5 text-[#065C2F]/60 border-[#065C2F]/10 hover:bg-black/10 hover:text-[#065C2F]/80'
                }`}
              >
                <Icon size={16} className={`sm:size-22 ${isActive ? 'icon-scaled' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Panel Content */}
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {view === 'reservations' && (
                <ReservationsPanel 
                  lang={lang} 
                  password={apiPassword} 
                  reservations={reservations} 
                  blackouts={blackouts} 
                  loading={dataLoading} 
                  onRefresh={fetchData} 
                />
              )}
              {view === 'blackout' && <BlackoutPanel lang={lang} password={apiPassword} onRefreshCalendar={fetchData} />}
              {view === 'facturas' && <FacturasPanel lang={lang} password={apiPassword} />}
              {view === 'reviews' && <ReviewsPanel lang={lang} password={apiPassword} />}
              {view === 'chat' && <ChatLogsPanel lang={lang} password={apiPassword} />}
              {view === 'contacts' && <ContactsPanel lang={lang} password={apiPassword} />}
              {view === 'training' && <BotTrainerPanel lang={lang} password={apiPassword} />}
              {view === 'settings' && <SettingsPanel lang={lang} password={apiPassword} onPasswordChange={setApiPassword} />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
