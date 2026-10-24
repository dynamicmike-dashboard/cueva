/**
 * La Cueva Del Chango — Teable Client
 * Single-source-of-truth data layer using Teable Cloud API.
 * Replaces Supabase client entirely.
 * 
 * API Docs: https://help.teable.ai/en/api-doc/overview
 * Base URL: https://app.teable.ai/api
 * Auth: Bearer Personal Access Token (teable_*)
 */

const getEnv = (key: string): string => {
  // @ts-ignore
  return import.meta?.env?.[key] || process.env?.[key] || '';
};

const TEABLE_BASE_URL = getEnv('TEABLE_BASE_URL') || getEnv('VITE_TEABLE_BASE_URL') || 'https://app.teable.ai/api';
const TEABLE_TOKEN = getEnv('TEABLE_TOKEN') || getEnv('VITE_TEABLE_TOKEN') || '';
const TEABLE_BASE_ID = getEnv('TEABLE_BASE_ID') || getEnv('VITE_TEABLE_BASE_ID') || '';

if (!TEABLE_TOKEN || !TEABLE_BASE_ID) {
  console.warn('[Teable] Missing TEABLE_TOKEN or TEABLE_BASE_ID — using placeholder');
}

// ---- Table IDs (configure in Teable UI, then paste here) ----
export const TEABLE_TABLES = {
  restaurant_secrets: getEnv('VITE_TEABLE_TABLE_RESTAURANT_SECRETS') || '',
  blackout_periods: getEnv('VITE_TEABLE_TABLE_BLACKOUT_PERIODS') || '',
  reservations: getEnv('VITE_TEABLE_TABLE_RESERVATIONS') || '',
  menu_items: getEnv('VITE_TEABLE_TABLE_MENU_ITEMS') || '',
  chat_logs: getEnv('VITE_TEABLE_TABLE_CHAT_LOGS') || '',
  reviews: getEnv('VITE_TEABLE_TABLE_REVIEWS') || '',
  profiles: getEnv('VITE_TEABLE_TABLE_PROFILES') || '',
  staff_members: getEnv('VITE_TEABLE_TABLE_STAFF_MEMBERS') || '',
  factura_requests: getEnv('VITE_TEABLE_TABLE_FACTURA_REQUESTS') || '',
  chatbot_rules: getEnv('VITE_TEABLE_TABLE_CHATBOT_RULES') || '',
  // Additional normalized data tables (server-only)
  admins: getEnv('TEABLE_TABLE_ADMINS') || '',
  menu_categories: getEnv('TEABLE_TABLE_MENU_CATEGORIES') || '',
} as const;

export type TeableTableName = keyof typeof TEABLE_TABLES;

interface TeableRecord {
  id: string;
  fields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface TeableListResponse {
  success: boolean;
  data: {
    records: TeableRecord[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
  error?: string;
}

interface TeableSingleResponse {
  success: boolean;
  data: TeableRecord;
  error?: string;
}

interface TeableCreateResponse {
  success: boolean;
  data: { id: string; recordId: string };
  error?: string;
}

interface TeableCreateBatchResponse {
  success: boolean;
  data: Array<{ id: string; recordId: string; fields?: Record<string, any> }>;
  error?: string;
}

interface TeableUpdateResponse {
  success: boolean;
  data: TeableRecord;
  error?: string;
}

interface TeableDeleteResponse {
  success: boolean;
  error?: string;
}

interface FilterCondition {
  fieldId: string;
  operator: 'eq' | 'neq' | 'contains' | 'notContains' | 'gt' | 'gte' | 'lt' | 'lte' | 'isEmpty' | 'isNotEmpty' | 'in' | 'notIn';
  value: any;
}

interface SortCondition {
  fieldId: string;
  direction: 'asc' | 'desc';
}

interface QueryOptions {
  take?: number;
  skip?: number;
  filter?: FilterCondition[];
  sort?: SortCondition[];
  viewId?: string;
  fieldKeyType?: 'id' | 'name' | 'dbFieldName';
  projection?: string[];
  cursor?: string;
}

class TeableClient {
  private baseUrl: string;
  private token: string;
  private baseId: string;

  constructor() {
    this.baseUrl = TEABLE_BASE_URL.replace(/\/+$/, '');
    this.token = TEABLE_TOKEN;
    this.baseId = TEABLE_BASE_ID;
  }

  private getTableId(tableName: TeableTableName): string {
    const id = TEABLE_TABLES[tableName];
    if (!id) throw new Error(`Teable table ID not configured for ${tableName}`);
    return id;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
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

  // ---- Records ----
  async list(tableName: TeableTableName, options: QueryOptions = {}): Promise<TeableListResponse> {
    const tableId = this.getTableId(tableName);
    const params = new URLSearchParams();
    if (options.take) params.set('take', String(options.take));
    if (options.skip) params.set('skip', String(options.skip));
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.viewId) params.set('viewId', options.viewId);
    if (options.fieldKeyType) params.set('fieldKeyType', options.fieldKeyType);
    if (options.projection?.length) params.set('projection', options.projection.join(','));
    if (options.filter?.length) params.set('filter', JSON.stringify(options.filter));
    if (options.sort?.length) params.set('sort', JSON.stringify(options.sort));
    
    return this.request<TeableListResponse>('GET', `/table/${tableId}/record?${params}`);
  }

  async get(tableName: TeableTableName, recordId: string, options: { fieldKeyType?: 'id' | 'name' | 'dbFieldName'; projection?: string[] } = {}): Promise<TeableSingleResponse> {
    const tableId = this.getTableId(tableName);
    const params = new URLSearchParams();
    if (options.fieldKeyType) params.set('fieldKeyType', options.fieldKeyType);
    if (options.projection?.length) params.set('projection', options.projection.join(','));
    
    return this.request<TeableSingleResponse>('GET', `/table/${tableId}/record/${recordId}?${params}`);
  }

  async create(tableName: TeableTableName, fields: Record<string, any>, options: { fieldKeyType?: 'id' | 'name' | 'dbFieldName'; typecast?: boolean } = {}): Promise<TeableCreateResponse> {
    const tableId = this.getTableId(tableName);
    const params = new URLSearchParams();
    if (options.fieldKeyType) params.set('fieldKeyType', options.fieldKeyType);
    if (options.typecast) params.set('typecast', 'true');
    
    return this.request<TeableCreateResponse>('POST', `/table/${tableId}/record?${params}`, {
      records: [{ fields }],
    });
  }

  async createBatch(tableName: TeableTableName, records: Array<{ fields: Record<string, any> }>, options: { fieldKeyType?: 'id' | 'name' | 'dbFieldName'; typecast?: boolean } = {}): Promise<TeableCreateBatchResponse> {
    const tableId = this.getTableId(tableName);
    const params = new URLSearchParams();
    if (options.fieldKeyType) params.set('fieldKeyType', options.fieldKeyType);
    if (options.typecast) params.set('typecast', 'true');
    
    return this.request<TeableCreateBatchResponse>('POST', `/table/${tableId}/record?${params}`, { records });
  }

  async update(tableName: TeableTableName, recordId: string, fields: Record<string, any>, options: { fieldKeyType?: 'id' | 'name' | 'dbFieldName'; typecast?: boolean } = {}): Promise<TeableUpdateResponse> {
    const tableId = this.getTableId(tableName);
    const params = new URLSearchParams();
    if (options.fieldKeyType) params.set('fieldKeyType', options.fieldKeyType);
    if (options.typecast) params.set('typecast', 'true');
    
    return this.request<TeableUpdateResponse>('PATCH', `/table/${tableId}/record/${recordId}?${params}`, {
      record: { fields },
    });
  }

  async delete(tableName: TeableTableName, recordId: string): Promise<TeableDeleteResponse> {
    const tableId = this.getTableId(tableName);
    return this.request<TeableDeleteResponse>('DELETE', `/table/${tableId}/record/${recordId}`);
  }

  // ---- Helpers for common patterns ----
  async findOne(tableName: TeableTableName, filter: FilterCondition[]): Promise<TeableRecord | null> {
    const res = await this.list(tableName, { filter, take: 1 });
    return res.data?.records[0] || null;
  }

  async findMany(tableName: TeableTableName, filter: FilterCondition[], options: { sort?: SortCondition[]; take?: number } = {}): Promise<TeableRecord[]> {
    const res = await this.list(tableName, { filter, sort: options.sort, take: options.take || 100 });
    return res.data?.records || [];
  }

  async upsert(tableName: TeableTableName, matchField: string, matchValue: any, fields: Record<string, any>): Promise<TeableRecord> {
    const existing = await this.findOne(tableName, [{
      fieldId: matchField,
      operator: 'eq',
      value: matchValue,
    }]);
    
    if (existing) {
      const updated = await this.update(tableName, existing.id, fields);
      return updated.data;
    }
    const created = await this.create(tableName, fields);
    return { 
      id: created.data.id, 
      fields, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    } as TeableRecord;
  }
}

export const teable = new TeableClient();

// ---- Compatibility layer for gradual migration ----
// Maps old Supabase-style calls to Teable
export function createTeableHelpers() {
  return {
    from: (table: TeableTableName) => ({
      select: async (columns?: string, options: QueryOptions = {}) => {
        if (columns && columns !== '*') {
          options.projection = columns.split(',').map(c => c.trim());
        }
        const res = await teable.list(table, options);
        return { data: res.data?.records.map(r => r.fields), error: res.error ? { message: res.error } : null };
      },
      insert: async (rows: any[], options: { returning?: 'minimal' | 'representation' } = {}) => {
        const res = await teable.createBatch(table, rows.map(r => ({ fields: r })));
        return { data: res.data, error: res.error ? { message: res.error } : null };
      },
      update: async (updates: any, options: { eq?: Record<string, any> } = {}) => {
        if (!options.eq) throw new Error('update requires .eq() filter');
        const filter = Object.entries(options.eq).map(([k, v]) => ({
          fieldId: k,
          operator: 'eq' as const,
          value: v,
        }));
        const records = await teable.findMany(table, filter);
        for (const r of records) {
          await teable.update(table, r.id, updates);
        }
        return { data: records, error: null };
      },
      delete: async (options: { eq?: Record<string, any> } = {}) => {
        if (!options.eq) throw new Error('delete requires .eq() filter');
        const filter = Object.entries(options.eq).map(([k, v]) => ({
          fieldId: k,
          operator: 'eq' as const,
          value: v,
        }));
        const records = await teable.findMany(table, filter);
        for (const r of records) {
          await teable.delete(table, r.id);
        }
        return { data: records, error: null };
      },
    }),
  };
}

export default teable;