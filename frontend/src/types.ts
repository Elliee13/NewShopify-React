import { LucideIcon } from "lucide-react";

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  quote: string;
}

export interface NavLink {
  name: string;
  href: string;
}

// -----------------------------
// Admin Dashboard Types
// -----------------------------

export type DesignStatus = 'pending' | 'printing' | 'completed';

export interface Design {
  id: number;

  // Canonical camelCase fields used in React
  productId: string;
  variantId: string;
  color: string | null;
  size: string | null;
  quantity: number;

  artworkFile: string | null;
  artworkUrl: string | null;

  cartId: string | null;
  checkoutUrl: string | null;

  status: DesignStatus;

  createdAt: string | null;
  updatedAt?: string | null;

  archived?: boolean | number;

  notes?: string | null;

  // Raw snake_case fields from backend (optional, used during normalization)
  product_id?: string;
  variant_id?: string;
  artwork_file?: string;
  artwork_url?: string;
  cart_id?: string;
  checkout_url?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DesignsSummary {
  pending: number;
  printing: number;
  completed: number;
  total: number;
}

export interface DesignsPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  perPage: number;
  total: number;
}

export interface DesignsResponse {
  data: Design[];
  pageInfo: DesignsPageInfo;
}

export interface DesignEvent {
  id: number;
  designId: number;
  action: 'status_change' | 'note_update' | 'archive' | string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string; // ISO or timestamp string from backend
}
