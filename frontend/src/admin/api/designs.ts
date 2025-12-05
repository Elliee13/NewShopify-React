// src/admin/api/designs.ts
import type {
  Design,
  DesignStatus,
  DesignsSummary,
  DesignEvent,
} from '../../types';

const BASE_API_URL =
  'http://localhost/NewShopify-React/backend/public/api.php';

// Use a token that matches what AdminAuth::check() expects
const ADMIN_TOKEN =
  import.meta.env.VITE_ADMIN_TOKEN ?? 'myAPIToken123';

export interface FetchDesignsParams {
  status?: DesignStatus | 'all';
  search?: string;
  sort?: 'created_desc' | 'created_asc';
  page?: number;
  perPage?: number;
  includeArchived?: boolean;
}

export interface DesignsPageInfo {
  page: number;
  perPage: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DesignsResponse {
  data: Design[];
  pageInfo: DesignsPageInfo;
  summary?: DesignsSummary;
}

function withAdminHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Accept: 'application/json',
    'X-Admin-Token': ADMIN_TOKEN,
    ...(extra ?? {}),
  };
}

export async function fetchDesigns(
  params: FetchDesignsParams
): Promise<DesignsResponse> {
  const {
    status,
    search,
    sort = 'created_desc',
    page = 1,
    perPage = 25,
    includeArchived,
  } = params;

  const url = new URL(`${BASE_API_URL}/api/designs`);

  url.searchParams.set('page', String(page));
  url.searchParams.set('perPage', String(perPage));
  url.searchParams.set('sort', sort);

  if (status && status !== 'all') {
    url.searchParams.set('status', status);
  }
  if (search) {
    url.searchParams.set('search', search);
  }
  if (includeArchived) {
    url.searchParams.set('includeArchived', '1');
  }

  const res = await fetch(url.toString(), {
    headers: withAdminHeaders(),
    // credentials not strictly required now, but harmless:
    // credentials: 'include',
  });

  if (!res.ok) {
    let details = '';
    try {
      details = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to load designs (${res.status})${
        details ? `: ${details}` : ''
      }`
    );
  }

  const json = await res.json();

  const raw: any[] = json.data ?? json.designs ?? [];

  const data: Design[] = raw.map((row) => ({
    ...row,
    productId: row.productId ?? row.product_id,
    variantId: row.variantId ?? row.variant_id,
    artworkFile: row.artworkFile ?? row.artwork_file ?? null,
    artworkUrl: row.artworkUrl ?? row.artwork_url ?? null,
    cartId: row.cartId ?? row.cart_id ?? null,
    checkoutUrl: row.checkoutUrl ?? row.checkout_url ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at ?? null,
    archived: row.archived ?? 0,
    notes: row.notes ?? null,
  }));

  const pageInfo: DesignsPageInfo = json.pageInfo ?? {
    page: json.page ?? page,
    perPage: json.perPage ?? perPage,
    total: json.total ?? data.length,
    hasNextPage: json.hasNextPage ?? false,
    hasPreviousPage: json.hasPreviousPage ?? page > 1,
  };

  const summary: DesignsSummary | undefined = json.summary;

  return { data, pageInfo, summary };
}

export async function updateDesignStatus(
  id: number,
  status: DesignStatus
): Promise<void> {
  const body = JSON.stringify({ id, status });

  const res = await fetch(`${BASE_API_URL}/api/designs/status`, {
    method: 'POST',
    headers: withAdminHeaders({
      'Content-Type': 'application/json',
    }),
    // credentials: 'include',
    body,
  });

  if (!res.ok) {
    let details = '';
    try {
      details = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to update status (${res.status})${
        details ? `: ${details}` : ''
      }`
    );
  }
}

export async function archiveDesign(id: number): Promise<void> {
  const body = JSON.stringify({ id });

  const res = await fetch(`${BASE_API_URL}/api/designs/archive`, {
    method: 'POST',
    headers: withAdminHeaders({
      'Content-Type': 'application/json',
    }),
    // credentials: 'include',
    body,
  });

  if (!res.ok) {
    let details = '';
    try {
      details = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to archive design (${res.status})${
        details ? `: ${details}` : ''
      }`
    );
  }
}

export async function updateDesignNotes(
  id: number,
  notes: string
): Promise<void> {
  const body = JSON.stringify({ id, notes });

  const res = await fetch(`${BASE_API_URL}/api/designs/notes`, {
    method: 'POST',
    headers: withAdminHeaders({
      'Content-Type': 'application/json',
    }),
    // credentials: 'include',
    body,
  });

  if (!res.ok) {
    let details = '';
    try {
      details = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to update notes (${res.status})${
        details ? `: ${details}` : ''
      }`
    );
  }
}

/**
 * Load event history for a single design
 */
export async function fetchDesignEvents(
  designId: number
): Promise<DesignEvent[]> {
  const url = new URL(`${BASE_API_URL}/api/designs/logs`);
  url.searchParams.set('id', String(designId));

  const res = await fetch(url.toString(), {
    headers: withAdminHeaders(),
    // credentials: 'include',
  });

  if (!res.ok) {
    let details = '';
    try {
      details = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to load design events (${res.status})${
        details ? `: ${details}` : ''
      }`
    );
  }

  const json = await res.json();
  const raw: any[] = json.logs ?? [];

  const events: DesignEvent[] = raw.map((row) => ({
    id: row.id,
    designId: row.design_id ?? designId,
    action: row.action,
    fromValue: row.from_value ?? null,
    toValue: row.to_value ?? null,
    createdAt: row.created_at ?? row.createdAt ?? '',
  }));

  return events;
}
