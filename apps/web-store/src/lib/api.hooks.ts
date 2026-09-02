import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

// ── Generic data extractor ────────────────────────────────────────────────────
const d = <T>(res: unknown) => (res as { data: T }).data;

// ── Store: Orders ─────────────────────────────────────────────────────────────

export function useStoreOrders(params: { status?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page)   qs.set('page', String(params.page));
  const q = qs.toString();
  return useQuery({
    queryKey: ['store-orders', params],
    queryFn:  () => api.get(`/api/v1/orders/store${q ? `?${q}` : ''}`).then(d<{ orders: OrderDoc[]; total: number; pages: number }>),
    refetchInterval: 30_000,
  });
}

export function useStoreOrderDetail(id: string) {
  return useQuery({
    queryKey:  ['store-order', id],
    queryFn:   () => api.get(`/api/v1/orders/store/${id}`).then(d<{ order: OrderDoc }>),
    enabled:   !!id,
    refetchInterval: 15_000,
  });
}

export function useOrderInvoice(orderId: string) {
  return useQuery({
    queryKey: ['order-invoice', orderId],
    queryFn:  () => api.get(`/api/v1/invoices/order/${orderId}`).then(d<{ invoice: InvoiceDoc }>),
    enabled:  !!orderId,
  });
}

// ── Store: Order transitions ──────────────────────────────────────────────────

function useStoreOrderMutation(id: string, path: string, method: 'post' | 'patch' = 'post') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: unknown) => api[method](`/api/v1/orders/store/${id}/${path}`, body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['store-orders'] }); qc.invalidateQueries({ queryKey: ['store-order', id] }); },
  });
}

export const useAcceptOrder      = (id: string) => useStoreOrderMutation(id, 'accept');
export const useRejectOrder      = (id: string) => useStoreOrderMutation(id, 'reject');
export const useAssignPickup     = (id: string) => useStoreOrderMutation(id, 'assign-pickup');
export const useReceiveAtStore   = (id: string) => useStoreOrderMutation(id, 'receive');
export const useMarkProcessing   = (id: string) => useStoreOrderMutation(id, 'processing');
export const useMarkReady        = (id: string) => useStoreOrderMutation(id, 'ready');
export const useAssignDelivery   = (id: string) => useStoreOrderMutation(id, 'assign-delivery');

export function useIssueInvoice(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post(`/api/v1/invoices/order/${orderId}`, body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['store-order', orderId] }); qc.invalidateQueries({ queryKey: ['order-invoice', orderId] }); },
  });
}

export function useConfirmPayment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { transactionRef: string }) => api.post(`/api/v1/orders/${orderId}/confirm-payment`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-order', orderId] });
      qc.invalidateQueries({ queryKey: ['store-orders'] });
      qc.invalidateQueries({ queryKey: ['order-invoice', orderId] });
    },
  });
}

// ── Store: Riders ─────────────────────────────────────────────────────────────

export function useStoreRiders() {
  return useQuery({
    queryKey: ['store-riders'],
    queryFn:  () => api.get('/api/v1/riders').then(d<{ riders: RiderDoc[] }>),
    staleTime: 60_000,
  });
}

export function useAddRider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; phone: string }) => api.post('/api/v1/riders', body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['store-riders'] }),
  });
}

export function useToggleRiderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/riders/${id}/status`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['store-riders'] }),
  });
}

// ── Rider: Jobs ───────────────────────────────────────────────────────────────

export function useRiderJobs(past = false) {
  return useQuery({
    queryKey:  ['rider-jobs', past],
    queryFn:   () => api.get(`/api/v1/orders/rider/jobs${past ? '?past=true' : ''}`).then(d<{ orders: OrderDoc[] }>),
    refetchInterval: past ? false : 20_000,
  });
}

function useRiderOrderMutation(id: string, path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body?: unknown) => api.post(`/api/v1/orders/rider/${id}/${path}`, body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['rider-jobs'] }); },
  });
}

export const useAcceptPickup     = (id: string) => useRiderOrderMutation(id, 'accept-pickup');
export const useVerifyPickupOtp  = (id: string) => useRiderOrderMutation(id, 'verify-pickup');
export const useAcceptDelivery   = (id: string) => useRiderOrderMutation(id, 'accept-delivery');
export const useCollectCod       = (id: string) => useRiderOrderMutation(id, 'collect-cod');
export const useVerifyDeliveryOtp = (id: string) => useRiderOrderMutation(id, 'verify-delivery');

// ── Store: Payouts ────────────────────────────────────────────────────────────

export interface PayoutDoc {
  _id:                  string;
  storeId:              string;
  periodFrom:           string;
  periodTo:             string;
  status:               string;
  totalInvoicedPaise:   number;
  totalCommissionPaise: number;
  onlineSharePaise:     number;
  codReceivablePaise:   number;
  netPayoutPaise:       number;
  lines:                unknown[];
  payoutRef?:           string;
  paidAt?:              string;
  createdAt:            string;
}

export function useStorePayouts(params: { status?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page)   qs.set('page',   String(params.page));
  return useQuery({
    queryKey: ['store-payouts', params],
    queryFn:  () => api.get(`/api/v1/payouts/store/mine?${qs}`).then(d<{ payouts: PayoutDoc[]; total: number; pages: number }>),
    staleTime: 5 * 60_000,
  });
}

// ── Media upload ──────────────────────────────────────────────────────────────

export interface UploadSignature {
  signature:  string;
  timestamp:  number;
  folder:     string;
  cloudName:  string;
  apiKey:     string;
  maxBytes:   number;
}

export function useUploadSignature(context: 'garment' | 'store-logo' | 'rider-selfie') {
  return useQuery({
    queryKey: ['upload-sig', context],
    queryFn:  () => api.get(`/api/v1/media/upload-signature?context=${context}`).then(d<UploadSignature>),
    staleTime: 4 * 60_000, // Cloudinary signatures are valid for 1 hour; refetch well before expiry
    enabled:  false, // fetch on demand via refetch()
  });
}

// ── Shared types (inline — avoids importing mongoose types in browser) ────────

export interface OrderDoc {
  _id: string;
  orderRef: string;
  status: string;
  paymentMode: string;
  paymentStatus: string;
  estimatePaise: number;
  discountPaise: number;
  invoiceId?: string;
  userId: string;
  storeId?: string;
  pickupRiderId?: string;
  deliveryRiderId?: string;
  address: { line1: string; line2?: string; city: string; state: string; pincode: string; lat?: number; lng?: number };
  pickupSlot: { date: string; windowId: string; windowLabel: string; start: string; end: string };
  items: { serviceId: string; serviceName: string; unit: string; quantity: number; unitPrice: number }[];
  statusHistory: { status: string; at: string; by?: string; note?: string }[];
  note?: string;
  cancelReason?: string;
  garmentPhotos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDoc {
  _id: string;
  invoiceRef: string;
  orderId: string;
  status: string;
  lines: { serviceId: string; serviceName: string; unit: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotalPaise: number;
  discountPaise: number;
  taxPercent: number;
  taxPaise: number;
  totalPaise: number;
  notes?: string;
  issuedAt?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paidAt?: string;
}

export interface RiderDoc {
  _id: string;
  name: string;
  phone: string;
  status: string;
  storeId?: string;
}
