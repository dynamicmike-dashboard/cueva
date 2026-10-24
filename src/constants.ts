export interface MenuItem {
  id: string;
  name_en: string;
  name_es: string;
  description_en: string;
  description_es: string;
  price: string;
  category: string;
  image?: string;
}

export interface Language {
  code: 'en' | 'es';
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇲🇽' }
];

export const COLORS = {
  forestGreen: 'var(--primary-beige)',
  sandyGold: 'var(--primary)',
  glassBg: 'var(--bg-glass)',
  textLight: '#F5F5F0',
  textDark: 'var(--primary-beige)'
};

export const WEEKEND_LOCKOUT_EN = "We do not take weekend reservations. Walk‑ins only.";
export const WEEKEND_LOCKOUT_ES = "No aceptamos reservas los fines de semana. Solo clientes sin reserva.";

import { MENU_DATA } from './menuData';
export { MENU_DATA };


export const RESTAURANT_ID = "lacuevadelchango";
export const RESTAURANT_NAME = "La Cueva Del Chango";

// Keep legacy Amate text for reference; La Cueva now primary
export const HISTORY_TEXT = {
  en: "La Cueva Del Chango is a warm, authentic hideaway in Playa del Carmen — sister to Amate 38. Nestled in a jungle-cave atmosphere, we share time-honored flavors and heartfelt hospitality. Our story mirrors the 26-year legacy of Calle 38: preserving natural beauty while celebrating regional culinary treasures.",
  es: "La Cueva Del Chango es un refugio cálido y auténtico en Playa del Carmen — hermana de Amate 38. En una atmósfera de cueva y selva, compartimos sabores ancestrales y hospitalidad sincera. Nuestra historia se inspira en los 26 años de legado de la Calle 38: preservar la belleza natural mientras celebramos los tesoros culinarios de la región."
};

export const TRANSLATIONS = {
  en: {
    menu: "Menu",
    reserve: "Reserve",
    reviews: "Reviews",
    admin: "Admin",
    password: "Password",
    login: "Login",
    logout: "Logout",
    continue: "Continue to Reservation",
    back: "Go Back",
    date: "Date",
    time: "Time",
    guests: "Number of Guests",
    name: "Name",
    email: "Email",
    confirmReservation: "Confirm Reservation",
    reservationSuccess: "Reservation Confirmed!",
    reservationError: "Error creating reservation. Please try again.",
    installApp: "Install App",
    gotIt: "Got it",
    selectAccess: "Select Access Level",
    adminDesc: "Manage menu & restaurant",
    staffLogin: "Staff Login",
    enterPasscode: "Enter your authorized passcode",
    loginStaff: "Login to Staff Account",
    failed: "Failed",
    connectionError: "Connection error",
    noReservations: "No reservations found.",
    pax: "pax",
     largeGroupMsg: "For reservations of more than 12 persons, please email to: info@lacuevadelchango.com",
     largeGroupOption: "More than 12 persons",
     addToCalendar: "Add to Calendar",
     noSundayReservations: "We do not take Sunday reservations. Walk-ins only. Sunday hours 8:00–14:00.",
     closedHours: "We are closed at this time. Please check our hours!",
     toleranceMsg: "Please note: There is a 10-minute grace period for your reservations.",
    management: "Management",
    reservations: "Reservations",
    config: "Settings",
    reminders: "Recordatorios",
    saveSecurity: "Save Settings",
    done: "Done",
    staff: "Staff",
    edit: "Edit",
    new: "New",
    delete: "Delete",
    reservation: "Reservation",
    phone: "Phone",
    newReservation: "New Reservation",
    editReservation: "Edit Reservation",
    status: "Status",
    settingsUpdated: "Settings updated",
    updateFailed: "Update failed",
    analyzing: "Analyzing...",
    reviewUs: "Review Us",
    language: "Language",
    tableReserve: "Table Reserve",
    razonSocial: "Legal Business Name",
    billingName: "Billing Name (Invoice)",
    rfcTaxId: "RFC / Tax ID",
    menuCategories: {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      vegan: "Vegan",
      desserts: "Desserts",
      drinks: "Drinks",
      wine: "Wine",
      groupEvents: "Group Events"
    },
    installationInstructions: "Installation Instructions",
    iosInstallSteps: "Tap Share > Add to Home Screen",
    androidInstallSteps: "Tap Menu > Install App"
  },
  es: {
    menu: "Menú",
    reserve: "Reservar",
    reviews: "Reseñas",
    admin: "Admin",
    password: "Contraseña",
    login: "Iniciar Sesión",
    logout: "Cerrar Sesión",
    continue: "Continuar a la Reserva",
    back: "Regresar",
    date: "Fecha",
    time: "Hora",
    guests: "Número de Personas",
    name: "Nombre",
    email: "Correo Electrónico",
    confirmReservation: "Confirmar Reserva",
    reservationSuccess: "¡Reserva confirmada!",
    reservationError: "Error al crear la reserva. Por favor intente de nuevo.",
    installApp: "Instalar App",
    gotIt: "Entendido",
    selectAccess: "Seleccionar Nivel de Acceso",
    adminDesc: "Gestionar menú y restaurante",
    staffLogin: "Acceso de Staff",
    enterPasscode: "Ingresa tu clave autorizada",
    loginStaff: "Entrar a Cuenta de Staff",
    failed: "Falló",
    connectionError: "Error de conexión",
    noReservations: "No se encontraron reservaciones.",
    pax: "pers",
     largeGroupMsg: "Para reservaciones de más de 12 personas, por favor envíe un correo a: info@lacuevadelchango.com",
     largeGroupOption: "Más de 12 personas",
     addToCalendar: "Agregar al Calendario",
     noSundayReservations: "No aceptamos reservas los domingos. Solo walk-ins. Horario domingo 8:00–14:00.",
     closedHours: "Estamos cerrados en este horario. ¡Por favor consulta nuestros horarios!",
     toleranceMsg: "Nota: Hay una tolerancia de 10 minutos en sus reservaciones.",
    management: "Gestión",
    reservations: "Reservaciones",
    config: "Ajustes",
    reminders: "Recordatorios",
    saveSecurity: "Guardar Ajustes",
    done: "Listo",
    staff: "Personal",
    edit: "Editar",
    new: "Nuevo",
    delete: "Eliminar",
    reservation: "Reservación",
    phone: "Teléfono",
    newReservation: "Nueva Reservación",
    editReservation: "Editar Reservación",
    status: "Estado",
    settingsUpdated: "Ajustes actualizados",
    updateFailed: "Error al actualizar",
    analyzing: "Analizando...",
    reviewUs: "Danos tu opinión",
    language: "Idioma",
    tableReserve: "Reservar Mesa",
    razonSocial: "Nombre / Razón Social",
    billingName: "Nombre en Factura",
    rfcTaxId: "RFC (ID Fiscal)",
    menuCategories: {
      breakfast: "Desayuno",
      lunch: "Comida",
      dinner: "Cena",
      vegan: "Vegano",
      desserts: "Postres",
      drinks: "Bebidas",
      wine: "Vinos",
      groupEvents: "Eventos"
    },
    installationInstructions: "Instrucciones de Instalación",
    iosInstallSteps: "Toca Compartir > Agregar a Inicio",
    androidInstallSteps: "Toca Menú > Instalar App"
  }
};
