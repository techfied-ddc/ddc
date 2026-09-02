// TanStack Query hooks for the customer app
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CatalogService {
  _id:           string;
  name:          string;
  description?:  string;
  unit:          string;
  effectivePrice: number; // paise
  imageUrl?:     string;
  sortOrder:     number;
}

export interface CatalogCategory {
  _id:       string;
  name:      string;
  imageUrl?: string;
  services:  CatalogService[];
}

export interface OrderSummary {
  _id:           string;
  orderRef:      string;
  status:        string;
  estimatePaise: number;
  discountPaise: number;
  createdAt:     string;
  items:         { serviceName: string; quantity: number; unitPrice: number }[];
}

export interface OrderDetail extends OrderSummary {
  storeId?:      string;
  address:       Record<string, string>;
  pickupSlot:    { date: string; windowLabel: string; start: string; end: string };
  paymentMode:   string;
  paymentStatus: string;
  statusHistory: { status: string; at: string }[];
  couponCode?:   string;
  rating?:       { score: number; comment?: string };
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export const useCatalog = (storeId?: string) =>
  useQuery<CatalogCategory[]>({
    queryKey:  ['catalog', storeId],
    queryFn:   async () => {
      const params = storeId ? `?storeId=${storeId}` : '';
      const res    = await api.get(`/api/v1/catalog${params}`) as { data: { catalog: CatalogCategory[] } };
      return res.data.catalog;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });

// ── Orders ────────────────────────────────────────────────────────────────────

export const useMyOrders = (params?: { status?: string; page?: number }) =>
  useQuery<{ orders: OrderSummary[]; total: number; pages: number }>({
    queryKey:  ['my-orders', params],
    queryFn:   async () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.page)   qs.set('page',   String(params.page));
      const res = await api.get(`/api/v1/orders/mine?${qs}`) as { data: { orders: OrderSummary[]; total: number; pages: number } };
      return res.data;
    },
  });

export const useOrderDetail = (orderId: string) =>
  useQuery<OrderDetail>({
    queryKey: ['order', orderId],
    queryFn:  async () => {
      const res = await api.get(`/api/v1/orders/mine/${orderId}`) as { data: { order: OrderDetail } };
      return res.data.order;
    },
    enabled: Boolean(orderId),
  });

export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post('/api/v1/orders', body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['my-orders'] }); },
  });
};

export const useRateOrder = (orderId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { rating: number; comment?: string }) =>
      api.post(`/api/v1/orders/mine/${orderId}/rate`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['order', orderId] }); },
  });
};

export const useCancelOrder = (orderId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { reason: string }) =>
      api.post(`/api/v1/orders/mine/${orderId}/cancel`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
};

export const useValidateCoupon = () =>
  useMutation({
    mutationFn: ({ code, orderTotal }: { code: string; orderTotal: number }) =>
      api.get(`/api/v1/coupons/validate?code=${code}&orderTotal=${orderTotal}`),
  });

// ── Invoice ───────────────────────────────────────────────────────────────────

export interface InvoiceLine {
  serviceId:   string;
  serviceName: string;
  unit:        string;
  quantity:    number;
  unitPrice:   number;
  lineTotal:   number;
}

export interface Invoice {
  _id:           string;
  orderId:       string;
  invoiceRef:    string;
  status:        string;
  lines:         InvoiceLine[];
  subtotalPaise: number;
  discountPaise: number;
  taxPercent:    number;
  taxPaise:      number;
  totalPaise:    number;
  notes?:        string;
  issuedAt:      string;
}

export const useOrderInvoice = (orderId: string) =>
  useQuery<Invoice>({
    queryKey: ['invoice', orderId],
    queryFn:  async () => {
      const res = await api.get(`/api/v1/invoices/order/${orderId}`) as { data: { invoice: Invoice } };
      return res.data.invoice;
    },
    enabled:  !!orderId,
    staleTime: 30_000,
  });

// ── Payments ──────────────────────────────────────────────────────────────────

export const useInitiatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      api.post('/api/v1/payments/initiate', { orderId, paymentMode: 'ONLINE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoice'] }); },
  });
};

export const useVerifyPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      api.post('/api/v1/payments/verify', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice'] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
};

// ── Tickets ───────────────────────────────────────────────────────────────────

export interface TicketSummary {
  _id:       string;
  ticketRef: string;
  subject:   string;
  status:    string;
  priority:  string;
  createdAt: string;
}

export interface TicketDetail extends TicketSummary {
  orderId?:  string;
  messages:  Array<{
    authorId:   string;
    authorRole: string;
    message:    string;
    attachments: string[];
    createdAt:  string;
  }>;
}

export const useMyTickets = () =>
  useQuery({
    queryKey: ['my-tickets'],
    queryFn:  () => api.get('/api/v1/tickets'),
    staleTime: 30_000,
  });

export const useTicketDetail = (id: string) =>
  useQuery({
    queryKey: ['ticket', id],
    queryFn:  () => api.get(`/api/v1/tickets/${id}`),
    enabled:  !!id,
    staleTime: 15_000,
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { subject: string; message: string; orderId?: string }) =>
      api.post('/api/v1/tickets', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tickets'] }),
  });
};

export const useReplyTicket = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { message: string }) =>
      api.post(`/api/v1/tickets/${id}/reply`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket', id] }),
  });
};
