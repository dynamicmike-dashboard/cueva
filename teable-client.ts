/**
 * La Cueva Del Chango — Frontend Teable Client
 * Browser-safe wrapper for Teable API calls.
 * Replaces @supabase/supabase-js client.
 * 
 * NOTE: For security, this client only exposes read operations.
 * Write operations (reservations, facturas, reviews) go through /api/* endpoints.
 */

// Extend ImportMeta for Vite env
declare global {
  interface ImportMetaEnv {
    readonly VITE_TEABLE_BASE_URL: string;
    readonly VITE_TEABLE_BASE_ID: string;
    readonly VITE_TEABLE_TABLE_MENU_ITEMS: string;
    readonly VITE_TEABLE_TABLE_RESTAURANT_SECRETS: string;
    readonly VITE_TEABLE_TABLE_CHATBOT_RULES: string;
    readonly VITE_TEABLE_TABLE_BLACKOUT_PERIODS: string;
    readonly VITE_TEABLE_TABLE_RESERVATIONS: string;
    readonly VITE_TEABLE_TABLE_CHAT_LOGS: string;
    readonly VITE_TEABLE_TABLE_REVIEWS: string;
    readonly VITE_TEABLE_TABLE_PROFILES: string;
    readonly VITE_TEABLE_TABLE_STAFF_MEMBERS: string;
    readonly VITE_TEABLE_TABLE_FACTURA_REQUESTS: string;
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_FREELLMAPI_URL: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const TEABLE_BASE_URL = import.meta.env.VITE_TEABLE_BASE_URL || 'https://app.teable.ai/api';
const TEABLE_BASE_ID = import.meta.env.VITE_TEABLE_BASE_ID || '';

// Table IDs from env
export const TEABLE_TABLES = {
  menu_items: import.meta.env.VITE_TEABLE_TABLE_MENU_ITEMS || '',
  restaurant_secrets: import.meta.env.VITE_TEABLE_TABLE_RESTAURANT_SECRETS || '',
  chatbot_rules: import.meta.env.VITE_TEABLE_TABLE_CHATBOT_RULES || '',
  blackout_periods: import.meta.env.VITE_TEABLE_TABLE_BLACKOUT_PERIODS || '',
  reservations: import.meta.env.VITE_TEABLE_TABLE_RESERVATIONS || '',
  chat_logs: import.meta.env.VITE_TEABLE_TABLE_CHAT_LOGS || '',
  reviews: import.meta.env.VITE_TEABLE_TABLE_REVIEWS || '',
  profiles: import.meta.env.VITE_TEABLE_TABLE_PROFILES || '',
  staff_members: import.meta.env.VITE_TEABLE_TABLE_STAFF_MEMBERS || '',
  factura_requests: import.meta.env.VITE_TEABLE_TABLE_FACTURA_REQUESTS || '',
} as const;

export type TeableTableName = keyof typeof TEABLE_TABLES;

interface TeableRecord {
  id: string;
  fields: Record<string, any>;
}

type SortDirection = 'asc' | 'desc';

interface FrontendListResponse {
  success: boolean;
  data: { records: TeableRecord[]; total: number; hasMore: boolean };
  error?: string;
}

class TeableFrontendClient {
  private baseUrl: string;
  private baseId: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_TEABLE_BASE_URL?.replace(/\/+$/, '') || 'https://app.teable.ai/api';
    this.baseId = import.meta.env.VITE_TEABLE_BASE_ID || '';
  }

  private getTableId(tableName: keyof typeof TEABLE_TABLES): string {
    const id = TEABLE_TABLES[tableName];
    if (!id) throw new Error(`Teable table ID not configured for ${tableName}`);
    return id;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Teable ${method} ${path} → ${res.status}: ${err}`);
    }
    return res.json() as Promise<T>;
  }

  async list(tableName: keyof typeof TEABLE_TABLES, options: { 
    filter?: Array<{ fieldId: string; operator: string; value: any }>;
    sort?: Array<{ fieldId: string; direction: 'asc' | 'desc' }>;
    take?: number;
    projection?: string[];
  } = {}): Promise<TeableRecord[]> {
    const tableId = this.getTableId(tableName);
    const params = new URLSearchParams();
    if (options.take) params.set('take', String(options.take));
    if (options.filter?.length) params.set('filter', JSON.stringify(options.filter));
    if (options.sort?.length) params.set('sort', JSON.stringify(options.sort));
    if (options.projection?.length) params.set('projection', options.projection.join(','));
    
    const res = await this.request<FrontendListResponse>('GET', `/table/${tableId}/record?${params}`);
    return res.data?.records || [];
  }

  // ---- Convenience methods for frontend ----
  
  /** Get active menu items for display */
  async getMenuItems(): Promise<Array<{ 
    id: string; 
    name_en: string; 
    name_es: string; 
    description_en: string; 
    description_es: string; 
    price: string; 
    category: string; 
    image?: string;
  }>> {
    const records = await this.list('menu_items', {
      filter: [{ fieldId: 'active', operator: 'eq', value: true }],
      sort: [{ fieldId: 'order_index', direction: 'asc' }],
    });
    return records.map(r => ({
      id: r.id,
      ...r.fields,
    })) as any;
  }

  /** Get restaurant config (hours, contact, etc.) */
  async getRestaurantConfig(): Promise<any> {
    const records = await this.list('restaurant_secrets', { take: 1 });
    return records[0]?.fields || null;
  }

  /** Get chatbot rules for AI behavior overrides */
  async getChatbotRules(): Promise<Array<{ 
    rule_type: string; 
    trigger_keywords: string[]; 
    response_text: string; 
    active: boolean 
  }>> {
    const records = await this.list('chatbot_rules', {
      filter: [{ fieldId: 'active', operator: 'eq', value: true }],
    });
    return records.map(r => r.fields as any);
  }
}

export const teableFrontend = new TeableFrontendClient();

export default teableFrontend;

// API admin helper for admin operations
export const apiAdmin = {
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