export type DesignStatus = 'pending' | 'printing' | 'completed';

export interface Design {
  id: number;
  productId: string;
  variantId: string;
  color: string;
  size: string;
  quantity: number;
  artworkFile: string;
  artworkUrl: string;
  cartId: string | null;
  checkoutUrl: string | null;
  status: DesignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DesignsResponse {
  data: Design[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    perPage: number;
    total: number;
  };
}


